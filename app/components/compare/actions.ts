"use server";

import { supabase } from "@/app/lib/supabaseClient";

/**
 * Ricerca nome per l'Onboarding con tendina
 */
export async function searchActivitiesByName(keyword: string) {
    console.log("--- CHIAMATA SERVER RICEVUTA PER KEYWORD: ---", keyword);

    if (!keyword || keyword.trim() === "") return { data: [], error: null };

    try {
        const { data, error } = await supabase
            .from("comparator_out_google")
            .select("id, name, google_category, avg_review, total_reviews, lat, lng")
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
 * Genera l'analisi dei concorrenti locali nel raggio d'azione
 */
export async function getLocalBenchmarks(lat: number, lng: number, radiusKm: number) {
    // Approssimazione: 1 grado di latitudine/longitudine è circa 111 km
    const degreeOffset = radiusKm / 111;

    try {
        const { data, error } = await supabase
            .from("comparator_out_google")
            .select("id, name, google_category, avg_review, total_reviews, lat, lng, website_url, online_booking_url, g_maps_link, address, phone")
            .gte("lat", lat - degreeOffset)
            .lte("lat", lat + degreeOffset)
            .gte("lng", lng - degreeOffset)
            .lte("lng", lng + degreeOffset)
            .order("total_reviews", { ascending: false });

        if (error) throw error;

        const processedData = (data || []).map((item) => {
            const avgReview = item.avg_review || 0;
            const totalReviews = item.total_reviews || 0;
            const boundedReviews = Math.min(totalReviews, 200);
            const score = Math.floor((avgReview * 12) + ((boundedReviews / 200) * 40));

            // Distanza pitagorica approssimativa
            const distance = Math.sqrt(Math.pow((item.lat! - lat) * 111, 2) + Math.pow((item.lng! - lng) * 111, 2));

            return {
                ...item,
                distance_km: distance,
                reputation_score: Math.max(0, Math.min(score, 100))
            };
        }).sort((a, b) => b.reputation_score - a.reputation_score);

        return { data: processedData, error: null };
    } catch (error: any) {
        console.error("Errore query Supabase:", error.message);
        return { data: [], error: error.message };
    }
}

/**
 * Recupera 5 attività randomiche dal database per i suggerimenti iniziali
 */
export async function getRandomActivities() {
    console.log("--- CHIAMATA SERVER RICEVUTA PER ATTIVITÀ RANDOM ---");
    try {
        // 1. Otteniamo il conteggio totale approssimativo dei record nella tabella
        const { count, error: countError } = await supabase
            .from("comparator_out_google")
            .select("*", { count: 'estimated', head: true });

        if (countError) throw countError;

        const totalRecords = count || 1000; // fallback se il conteggio fallisce
        
        // 2. Generiamo un punto di partenza casuale (offset) 
        // Sottraiamo 5 per evitare di sforare l'indice massimo del DB
        const randomOffset = Math.floor(Math.random() * Math.max(1, totalRecords - 5));

        // 3. Prendiamo 5 record consecutivi a partire da quell'offset randomico
        const { data, error } = await supabase
            .from("comparator_out_google")
            .select("id, name, google_category, avg_review, total_reviews, lat, lng")
            .range(randomOffset, randomOffset + 4);

        if (error) {
            console.error("ERRORE DI SUPABASE LATO SERVER (RANDOM):", error.message);
            return { data: [], error: error.message };
        }

        // 4. Opzionale: mescoliamo ulteriormente i 5 risultati estratti per massima dinamicità
        const shuffled = (data || []).sort(() => 0.5 - Math.random());

        console.log(`ESTRATTI ${shuffled.length} RECORD RANDOMICI CON OFFSET ${randomOffset}`);
        return { data: shuffled, error: null };
    } catch (error: any) {
        console.error("ECCEZIONE CATCH RANDOM LATO SERVER:", error.message);
        return { data: [], error: error.message };
    }
}