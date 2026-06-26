"use server";

import { supabase } from "@/app/lib/supabaseClient";

export interface BenchmarkRecord {
    id: string;
    name: string;
    google_category: string | null;
    avg_review: number | null;
    total_reviews: number | null;
    miodottore_reviews: number | null;
    miodottore_avg: number | null;
    website_url: string | null;
    online_booking_url: string | null;
    g_maps_link: string | null;
    dp_link_url: string | null;
    distance_km: number;
    reputation_score: number;
    address: string | null;
    phone: string | null;
}

/**
 * Ricerca nome per l'Onboarding con tendina
 */
export async function searchActivitiesByName(keyword: string) {
    console.log("--- CHIAMATA SERVER RICEVUTA PER KEYWORD: ---", keyword);

    if (!keyword || keyword.trim() === "") return { data: [], error: null };

    try {
        const { data, error } = await supabase
            .from("comparator_out_google")
            .select("id, name, google_category, avg_review, total_reviews, lat, lng, address, phone")
            .ilike("name", `%${keyword.trim()}%`)
            .limit(8);

        if (error) {
            console.error("ERRORE DI SUPABASE LATO SERVER:", error.message);
            return { data: [], error: error.message };
        }

        console.log(`TROVATI ${data?.length || 0} RECORD SUL DB`);
        return { data: data || [], error: null };
    } catch (error: any) {
        console.error("ECCEZIONE CATCH LATO SERVER:", error.message);
        return { data: [], error: error.message };
    }
}

/**
 * Genera l'analisi dei concorrenti locali nel raggio d'azione includendo google e MioDottore
 */
export async function getLocalBenchmarks(
    lat: number,
    lng: number,
    radiusKm: number
): Promise<{ data: BenchmarkRecord[]; error: string | null }> {

    // Approssimazione: 1 grado di latitudine/longitudine è circa 111 km
    const degreeOffset = radiusKm / 111;

    try {
        const { data, error } = await supabase
            .from("comparator_out_google")
            .select(`
                id, 
                name, 
                google_category, 
                avg_review, 
                total_reviews, 
                lat, 
                lng, 
                website_url, 
                online_booking_url, 
                g_maps_link, 
                address, 
                phone,
                comparator_link_g_dp (
                    comparator_out_dp (
                        id,
                        tot_dc_reviews,
                        avg_grade,
                        created_at,
                        dp_link_url
                    )
                )
            `)
            .gte("lat", lat - degreeOffset)
            .lte("lat", lat + degreeOffset)
            .gte("lng", lng - degreeOffset)
            .lte("lng", lng + degreeOffset);

        if (error) throw error;

        const rawData = data || [];

        // 1. TROVIAMO I MASSIMI REALI NEL MERCATO LOCALE SELEZIONATO
        // Questo fa sì che il punteggio sia relativo a chi fa meglio in quella specifica zona!
        const maxGoogleReviewsInArea = Math.max(...rawData.map((item: any) => item.total_reviews || 0), 100);

        const maxMdReviewsInArea = Math.max(...rawData.map((item: any) => {
            if (item.comparator_link_g_dp && item.comparator_link_g_dp.length > 0) {
                const dp = item.comparator_link_g_dp.map((l: any) => l.comparator_out_dp).filter(Boolean);
                return dp.length > 0 ? (dp[0].tot_dc_reviews || 0) : 0;
            }
            return 0;
        }), 50);

        const processedData: BenchmarkRecord[] = rawData.map((item: any) => {
            const avgReview = item.avg_review || 0;
            const googleReviews = item.total_reviews || 0;

            // --- GESTIONE DATI MIODOTTORE ---
            let miodottoreReviews: number | null = null;
            let miodottoreAvg: number | null = null;
            let dpLinkUrl: string | null = null;

            if (item.comparator_link_g_dp && item.comparator_link_g_dp.length > 0) {
                const dpRecords = item.comparator_link_g_dp
                    .map((link: any) => link.comparator_out_dp)
                    .filter(Boolean);

                if (dpRecords.length > 0) {
                    dpRecords.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );

                    miodottoreReviews = dpRecords[0].tot_dc_reviews;
                    miodottoreAvg = dpRecords[0].avg_grade;
                    dpLinkUrl = dpRecords[0].dp_link_url;
                }
            }
            // ---------------------------------

            // --- CALCOLO DEL REPUTATION SCORE DINAMICO ---
            // --- NUOVA LOGICA AVANZATA A 7 SCAGLIONI ---
            const gReviews = item.total_reviews || 0;
            const gAvg = item.avg_review || 0;
            const mdReviews = miodottoreReviews || 0;

            // Cumulato pesato tra Google e MioDottore
            const totalReviewsCount = gReviews + mdReviews;

            let trustFactor = 0.3;
            let volumePoints = 0;

            if (totalReviewsCount <= 15) {
                // Scaglione 1: 0 - 15 (Basso basso)
                trustFactor = 0.3;
                volumePoints = (totalReviewsCount / 15) * 5; // max 5 punti
            }
            else if (totalReviewsCount > 15 && totalReviewsCount <= 40) {
                // Scaglione 2: 16 - 40 (Interessante)
                trustFactor = 0.5;
                volumePoints = 5 + ((totalReviewsCount - 15) / 25) * 5; // max 10 punti
            }
            else if (totalReviewsCount > 40 && totalReviewsCount <= 100) {
                // Scaglione 3: 41 - 100 (Molto interessante)
                trustFactor = 0.7;
                volumePoints = 10 + ((totalReviewsCount - 40) / 60) * 10; // max 20 punti
            }
            else if (totalReviewsCount > 100 && totalReviewsCount <= 250) {
                // Scaglione 4: 101 - 250 (Consolidato)
                trustFactor = 0.85;
                volumePoints = 20 + ((totalReviewsCount - 100) / 150) * 5; // max 25 punti
            }
            else if (totalReviewsCount > 250 && totalReviewsCount <= 500) {
                // Scaglione 5: 251 - 500 (Leader Locale)
                trustFactor = 0.95;
                volumePoints = 25 + ((totalReviewsCount - 250) / 250) * 5; // max 30 punti
            }
            else if (totalReviewsCount > 500 && totalReviewsCount <= 1000) {
                // Scaglione 6: 501 - 1000 (Gigante del mercato)
                trustFactor = 1.0;
                volumePoints = 30 + ((totalReviewsCount - 500) / 500) * 10; // max 40 punti
            }
            else {
                // Scaglione 7: Oltre 1000 (Dominio assoluto)
                trustFactor = 1.0;
                volumePoints = 40; // Raggiunto il cap massimo di volume
            }

            // Calcolo dei punti qualità (voto Google su base 60)
            const qualityPoints = gAvg * 12; // Se ha 5.0 -> 60 punti. Se ha 4.5 -> 54 punti.

            // Calcolo finale combinato
            const calculatedScore = Math.floor((qualityPoints * trustFactor) + volumePoints);
            const finalScore = Math.max(0, Math.min(calculatedScore, 100));


            //--------------------------------------------

            // Distanza pitagorica approssimativa
            const distance = Math.sqrt(
                Math.pow((item.lat! - lat) * 111, 2) +
                Math.pow((item.lng! - lng) * 111, 2)
            );

            return {
                id: item.id,
                name: item.name,
                google_category: item.google_category,
                avg_review: avgReview,
                total_reviews: googleReviews,
                miodottore_reviews: miodottoreReviews,
                miodottore_avg: miodottoreAvg,
                website_url: item.website_url || null,
                online_booking_url: item.online_booking_url || null,
                g_maps_link: item.g_maps_link,
                dp_link_url: dpLinkUrl,
                address: item.address,
                phone: item.phone,
                distance_km: distance,
                reputation_score: finalScore
            };
        }).sort((a, b) => b.reputation_score - a.reputation_score);

        return { data: processedData, error: null };
    } catch (error: any) {
        console.error("Errore query Supabase con join:", error.message);
        return { data: [], error: error.message };
    }
}

/**
 * Recupera 5 attività randomiche dal database per i suggerimenti iniziali
 */
export async function getRandomActivities() {
    console.log("--- CHIAMATA SERVER RICEVUTA PER ATTIVITÀ RANDOM ---");
    try {
        const { count, error: countError } = await supabase
            .from("comparator_out_google")
            .select("*", { count: 'estimated', head: true });

        if (countError) throw countError;

        const totalRecords = count || 1000;
        const randomOffset = Math.floor(Math.random() * Math.max(1, totalRecords - 5));

        const { data, error } = await supabase
            .from("comparator_out_google")
            .select("id, name, google_category, avg_review, total_reviews, lat, lng, address, phone")
            .range(randomOffset, randomOffset + 4);

        if (error) {
            console.error("ERRORE DI SUPABASE LATO SERVER (RANDOM):", error.message);
            return { data: [], error: error.message };
        }

        const shuffled = (data || []).sort(() => 0.5 - Math.random());
        console.log(`ESTRATTI ${shuffled.length} RECORD RANDOMICI CON OFFSET ${randomOffset}`);
        return { data: shuffled, error: null };
    } catch (error: any) {
        console.error("ECCEZIONE CATCH RANDOM LATO SERVER:", error.message);
        return { data: [], error: error.message };
    }
}


/**
 * Recupera una singola attività dal database tramite il suo ID UUID
 * Utilizzata come fallback nella pagina della clinica se mancano le coordinate nell'URL
 */
export async function getClinicById(id: string) {
    console.log("--- CHIAMATA SERVER RICEVUTA PER RECUPERO CLINICA DA ID UUID: ---", id);

    if (!id) return { data: null, error: "ID non fornito" };

    try {
        const { data, error } = await supabase
            .from("comparator_out_google")
            .select("id, name, lat, lng")
            .eq("id", id)
            .maybeSingle(); // Ritorna l'oggetto singolo o null se non esiste, senza sollevare errori di array

        if (error) {
            console.error("ERRORE DI SUPABASE NEL RECUPERO CLINICA:", error.message);
            return { data: null, error: error.message };
        }

        return { data: data, error: null };
    } catch (error: any) {
        console.error("ECCEZIONE CATCH RECUPERO CLINICA:", error.message);
        return { data: null, error: error.message };
    }
}