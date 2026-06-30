"use server";

import { supabase } from "@/app/lib/supabaseClient";

export interface EmailImportInput {
    nome_clinica: string;
    google_maps_id: string;
    indirizzo: string;
    email_ordinaria: string;
}

export interface CheckedRecord {
    google_maps_id: string;
    nome_json: string;
    nome_db: string | null;
    email_json: string;
    email_db: string | null;
    match_type: "id_link" | "fuzzy" | "nessuno";
    score: number; // Mostrerà sempre il punteggio massimo calcolato!
    status: "disponibile" | "gia_presente" | "non_trovato";
    db_id?: string;
    indirizzo_db?: string;
}

export interface ImportResult {
    success: boolean;
    processed: number;
    updated: number;
    skipped: number;
    error: string | null;
}

// --- UTILITIES DI CONFRONTO TESTUALE ---

function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

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

function extractPlaceIdFromLink(link: string | null): string | null {
    if (!link) return null;
    const match = link.match(/ChIJ[a-zA-Z0-9_-]{23}/);
    return match ? match[0] : null;
}

// --- CORE LOGIC ---

export async function checkEmailsBeforeImport(jsonData: EmailImportInput[]): Promise<{ data: CheckedRecord[]; error: string | null }> {
    if (!jsonData || jsonData.length === 0) return { data: [], error: null };

    try {
        const { data: dbRecords, error: fetchError } = await supabase
            .from("comparator_out_google")
            .select("id, name, email, g_maps_link, google_place_id, address");

        if (fetchError) throw fetchError;

        const processedRecords: CheckedRecord[] = jsonData.map(item => {
            let bestMatch: any = null;
            let matchType: CheckedRecord["match_type"] = "nessuno";
            let bestScore = 0;
            let foundExactId = false;

            // 1. Cerca prima se esiste un match esatto via ID
            for (const dbRec of dbRecords || []) {
                const placeIdFromLink = extractPlaceIdFromLink(dbRec.g_maps_link);
                const placeIdDirect = dbRec.google_place_id;

                if (
                    (placeIdFromLink && placeIdFromLink === item.google_maps_id) ||
                    (placeIdDirect && placeIdDirect === item.google_maps_id)
                ) {
                    bestMatch = dbRec;
                    matchType = "id_link";
                    bestScore = 100;
                    foundExactId = true;
                    break;
                }
            }

            // 2. Se l'ID NON è stato trovato, esegui il Fuzzy su TUTTI e tieni traccia del REALE punteggio più alto
            if (!foundExactId) {
                matchType = "fuzzy";
                for (const dbRec of dbRecords || []) {
                    if (dbRec.name && item.nome_clinica && dbRec.address && item.indirizzo) {
                        const nameScore = getSimilarityScore(item.nome_clinica, dbRec.name);
                        const addressScore = getSimilarityScore(item.indirizzo, dbRec.address);
                        const totalScore = (nameScore * 0.7 + addressScore * 0.3) * 100;

                        // Memorizziamo il record migliore in assoluto, a prescindere dal punteggio
                        if (totalScore > bestScore) {
                            bestScore = Math.round(totalScore);
                            bestMatch = dbRec;
                        }
                    }
                }
            }

            // 3. Determina lo stato finale (L'email a DB ha sempre la priorità assoluta)
            let status: CheckedRecord["status"] = "non_trovato";

            if (bestMatch) {
                if (bestMatch.email && bestMatch.email.trim() !== "") {
                    // Se il record ha GIÀ un'email a DB, lo stato è "gia_presente" a prescindere dal punteggio fuzzy
                    status = "gia_presente";
                } else if (foundExactId || bestScore >= 85) {
                    // Se non ha l'email ed è un match ID valido o supera la soglia fuzzy
                    status = "disponibile";
                } else {
                    // Se non ha l'email ma il fuzzy è insufficiente (qui comparirà il tasto "Accetta")
                    status = "non_trovato";
                }
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
                db_id: bestMatch ? bestMatch.id : undefined,
                indirizzo_db: bestMatch ? bestMatch.address : null
            };
        });

        return { data: processedRecords, error: null };
    } catch (error: any) {
        console.error("Errore nel check:", error.message);
        return { data: [], error: error.message };
    }
}

// (La funzione importEmailsFromJson rimane identica alla precedente)
export async function importEmailsFromJson(checkedData: CheckedRecord[]): Promise<ImportResult> {
    if (!checkedData || checkedData.length === 0) return { success: true, processed: 0, updated: 0, skipped: 0, error: null };
    try {
        // Rimuoviamo il checkRes = await checkEmailsBeforeImport(...) poiché i dati sono già pronti

        // Filtriamo direttamente i record che il client ci ha inviato come "disponibili"
        const targetUpdates = checkedData.filter(r => r.status === "disponibile" && r.db_id && r.email_json);
        if (targetUpdates.length === 0) return { success: true, processed: checkedData.length, updated: 0, skipped: checkedData.length, error: null };

        const updatePromises = targetUpdates.map(record =>
            supabase.from("comparator_out_google").update({
                email: record.email_json.trim().toLowerCase(),
                updated_at: new Date().toISOString()
            }).eq("id", record.db_id!)
        );

        const results = await Promise.all(updatePromises);
        if (results.find(r => r.error)) throw new Error("Errore durante l'aggiornamento massivo.");

        return { success: true, processed: checkedData.length, updated: targetUpdates.length, skipped: checkedData.length - targetUpdates.length, error: null };
    } catch (error: any) {
        return { success: false, processed: 0, updated: 0, skipped: 0, error: error.message };
    }
}