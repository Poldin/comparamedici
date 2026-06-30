"use server";

import { supabase } from "@/app/lib/supabaseClient";

export interface EmailImportInput {
    nome_clinica: string;
    google_maps_id: string;
    email_ordinaria: string;
}

export interface CheckedRecord {
    google_maps_id: string;
    nome_json: string;
    nome_db: string | null;
    email_json: string;
    email_db: string | null;
    match_type: "id_link" | "fuzzy" | "nessuno";
    score: number; // Percentuale di match (100 per ID, o 0-100 per fuzzy)
    status: "disponibile" | "gia_presente" | "non_trovato";
    db_id?: string; // ID interno del record da aggiornare
}

export interface ImportResult {
    success: boolean;
    processed: number;
    updated: number;
    skipped: number;
    error: string | null;
}

// --- UTILITIES DI CONFRONTO TESTUALE ---

/**
 * Pulisce e normalizza il testo per il confronto (rimuove accenti, punteggiatura e spazi doppi)
 */
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Rimuove accenti
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Rimuove punteggiatura
        .replace(/\s+/g, " ") // Compatta gli spazi
        .trim();
}

/**
 * Calcola la similitudine tra due stringhe (Dice's Coefficient) - Ritorna un valore da 0 a 1
 */
function getSimilarityScore(str1: string, str2: string): number {
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);

    if (s1 === s2) return 1;
    if (s1.length < 2 || s2.length < 2) return 0;

    const getBigrams = (str: string) => {
        const bigrams = new Set<string>();
        for (let i = 0; i < str.length - 1; i++) {
            bigrams.add(str.substring(i, i + 2));
        }
        return bigrams;
    };

    const b1 = getBigrams(s1);
    const b2 = getBigrams(s2);
    
    let intersection = 0;
    b1.forEach(bigram => {
        if (b2.has(bigram)) intersection++;
    });

    return (2 * intersection) / (b1.size + b2.size);
}

/**
 * Estrae il Place ID (ChIJ...) da un URL di Google Maps
 */
function extractPlaceIdFromLink(link: string | null): string | null {
    if (!link) return null;
    const match = link.match(/ChIJ[a-zA-Z0-9_-]{23}/);
    return match ? match[0] : null;
}

// --- CORE LOGIC ---

/**
 * FASE 1: Rileva e analizza a cascata (1: ID da link, 2: Fuzzy Match > 90%)
 */
export async function checkEmailsBeforeImport(jsonData: EmailImportInput[]): Promise<{ data: CheckedRecord[]; error: string | null }> {
    if (!jsonData || jsonData.length === 0) return { data: [], error: null };

    try {
        // Scarichiamo tutti i record dal DB per fare l'analisi incrociata in memoria
        // NOTA: Se la tabella ha decine di migliaia di record, converrà limitare la query per area geografica.
        const { data: dbRecords, error: fetchError } = await supabase
            .from("comparator_out_google")
            .select("id, name, email, g_maps_link, google_place_id");

        if (fetchError) throw fetchError;

        const processedRecords: CheckedRecord[] = jsonData.map(item => {
            let bestMatch: any = null;
            let matchType: CheckedRecord["match_type"] = "nessuno";
            let bestScore = 0;

            // Applichiamo la cascata su tutti i record del DB
            for (const dbRec of dbRecords || []) {
                // Livello 1: Verifica esatta tramite Place ID estratto dal link (o dalla colonna se popolata correttamente)
                const placeIdFromLink = extractPlaceIdFromLink(dbRec.g_maps_link);
                const placeIdDirect = dbRec.google_place_id;

                if (
                    (placeIdFromLink && placeIdFromLink === item.google_maps_id) || 
                    (placeIdDirect && placeIdDirect === item.google_maps_id)
                ) {
                    bestMatch = dbRec;
                    matchType = "id_link";
                    bestScore = 100;
                    break; // Trovato match perfetto via ID, interrompiamo il ciclo
                }

                // Livello 2: Se non c'è match ID, calcoliamo il punteggio Fuzzy sul nome della clinica
                if (dbRec.name && item.nome_clinica) {
                    const score = getSimilarityScore(item.nome_clinica, dbRec.name) * 100;
                    // Se supera il 90% ed è migliore di un eventuale match fuzzy precedente
                    if (score >= 90 && score > bestScore) {
                        bestScore = Math.round(score);
                        bestMatch = dbRec;
                        matchType = "fuzzy";
                    }
                }
            }

            // Definiamo lo stato in base al match trovato
            let status: CheckedRecord["status"] = "non_trovato";
            if (bestMatch) {
                status = (bestMatch.email && bestMatch.email.trim() !== "") ? "gia_presente" : "disponibile";
            }

            return {
                google_maps_id: item.google_maps_id,
                nome_json: item.nome_clinica,
                nome_db: bestMatch ? bestMatch.name : null,
                email_json: item.email_ordinaria,
                email_db: bestMatch ? bestMatch.email : null,
                match_type: matchType,
                score: bestScore,
                status,
                db_id: bestMatch ? bestMatch.id : undefined
            };
        });

        return { data: processedRecords, error: null };
    } catch (error: any) {
        console.error("Errore in fase di check a cascata:", error.message);
        return { data: [], error: error.message };
    }
}

/**
 * FASE 2: Esegue il salvataggio basandosi sulla stessa logica a cascata
 */
export async function importEmailsFromJson(jsonData: EmailImportInput[]): Promise<ImportResult> {
    if (!jsonData || jsonData.length === 0) return { success: true, processed: 0, updated: 0, skipped: 0, error: null };

    try {
        // Rieseguiamo il check per avere la certezza assoluta degli ID di destinazione corretti
        const checkRes = await checkEmailsBeforeImport(jsonData);
        if (checkRes.error) throw new Error(checkRes.error);

        // Filtriamo solo i record che sono risultati effettivamente "disponibili" per l'aggiornamento
        const targetUpdates = checkRes.data.filter(r => r.status === "disponibile" && r.db_id && r.email_json);

        if (targetUpdates.length === 0) {
            return { success: true, processed: jsonData.length, updated: 0, skipped: jsonData.length, error: null };
        }

        // Eseguiamo gli aggiornamenti usando la chiave primaria ID del DB (più sicuro dell'upsert su chiavi esterne)
        // Per evitare troppe chiamate asincrone singole, usiamo Promise.all
        const updatePromises = targetUpdates.map(record => 
            supabase
                .from("comparator_out_google")
                .update({ 
                    email: record.email_json.trim().toLowerCase(),
                    updated_at: new Date().toISOString()
                })
                .eq("id", record.db_id!)
        );

        const results = await Promise.all(updatePromises);
        const hasError = results.find(r => r.error);
        if (hasError) throw hasError.error;

        return {
            success: true,
            processed: jsonData.length,
            updated: targetUpdates.length,
            skipped: jsonData.length - targetUpdates.length,
            error: null
        };
    } catch (error: any) {
        console.error("Errore durante la scrittura delle email:", error.message);
        return { success: false, processed: 0, updated: 0, skipped: 0, error: error.message };
    }
}