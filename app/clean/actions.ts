"use server";

import { supabase } from "@/app/lib/supabaseClient";
import { revalidatePath } from "next/cache";

/**
 * HELPER: Recupera un singolo record Google aggiornato con tutte le sue relazioni.
 * Viene usato internamente per restituire lo stato fresco alla sidebar dopo ogni modifica.
 */
async function getSingleGoogleRecord(id: string) {
    const { data, error } = await supabase
        .from("comparator_out_google")
        .select(`
        id,
        name,
        google_category,
        phone,
        website_url,
        online_booking_url,
        address,
        avg_review,
        total_reviews,
        email,
        comparator_email_sent (
          id,
          email_sent_tmz
        ),
        comparator_link_g_dp (
          id,
          dp_id,
          other,
          comparator_out_dp (
            id,
            name,
            dp_category,
            tot_dc_reviews,
            avg_grade,
            dp_link_url
          )
        )
      `)
        .eq("id", id)
        .single();

    if (error) {
        console.error("Errore helper getSingleGoogleRecord:", error.message);
        return null;
    }
    return data;
}

/**
 * Recupera i record di Google filtrati per ricerca testuale, categoria, presenza email e stato di invio con Paginazione Server-Side
 */
export async function getGoogleRecords(
    search?: string,
    categories?: string[],
    page: number = 1,
    pageSize: number = 100,
    onlyMioDottore: boolean = false,
    emailPresenceStatus: "all" | "with_email" | "without_email" = "all", // 👈 Aggiornato a 3 stati
    emailSentStatus: "all" | "sent" | "not_sent" = "all"                 // 👈 Aggiornato a 3 stati
) {
    try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from("comparator_out_google")
            .select(`
            id,
            name,
            google_category,
            phone,
            website_url,
            online_booking_url,
            address,
            avg_review,
            total_reviews,
            lat,
            lng,
            g_maps_link,
            email,
            comparator_email_sent (
              id,
              email_sent_tmz
            ),
            comparator_link_g_dp (
              id,
              dp_id,
              other,
              comparator_out_dp (
                id,
                name,
                dp_category,
                tot_dc_reviews,
                avg_grade,
                dp_link_url
              )
            )
          `, { count: 'exact' })
            .order("created_at", { ascending: false });

        // Filtro di ricerca testuale
        if (search && search.trim() !== "") {
            query = query.ilike("name", `%${search.trim()}%`);
        }

        // Filtro categorie
        if (categories && categories.length > 0) {
            query = query.in("google_category", categories);
        }

        // Filtro piattaforma MioDottore / DocPlanner
        if (onlyMioDottore) {
            query = query.or("online_booking_url.ilike.%miodottore%,online_booking_url.ilike.%docplanner%");
        }

        // 1. Filtro Intelligente Presenza Email (Tutti / Con Email / Senza Email)
        if (emailPresenceStatus === "with_email") {
            query = query.not("email", "is", null).neq("email", "");
        } else if (emailPresenceStatus === "without_email") {
            query = query.or("email.is.null,email.eq.");
        }

        // 2. Filtro Intelligente Stato Invio Mail (Tutti / Già Inviate / Da Inviare)
        if (emailSentStatus === "sent") {
            // Mostra solo i record che hanno ALMENO un invio registrato
            query = query.not("comparator_email_sent", "is", null);
        } else if (emailSentStatus === "not_sent") {
            // Mostra solo i record che NON hanno alcun invio registrato
            query = query.is("comparator_email_sent", null);
        }

        const { data, error, count } = await query.range(from, to);

        if (error) {
            console.error("Errore fetch Google Records:", error.message);
            return { data: [], count: 0 };
        }

        return {
            data: data || [],
            count: count || 0
        };
    } catch (error: any) {
        console.error("Eccezione fetch Google Records:", error.message);
        return { data: [], count: 0 };
    }
}

/**
 * Aggiorna un record esistente sulla tabella Google e ritorna l'oggetto aggiornato
 */
export async function updateGoogleRecord(id: string, updateData: any) {
    try {
        const { error } = await supabase
            .from("comparator_out_google")
            .update(updateData)
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/clean");

        // Ritorna il record completo e fresco per aggiornare la sidebar
        return await getSingleGoogleRecord(id);
    } catch (error: any) {
        console.error("Errore aggiornamento Google:", error.message);
        return null;
    }
}

/**
 * Crea un nuovo record DocPlanner (MioDottore), lo collega e RITORNA il record Google completo
 */
export async function createAndLinkDPRecord(googleId: string, dpData: any) {
    try {
        // 1. Inserimento in comparator_out_dp
        const { data: dpRecord, error: dpError } = await supabase
            .from("comparator_out_dp")
            .insert([dpData])
            .select("id")
            .single();

        if (dpError) throw dpError;

        // 2. Creazione della riga di match
        const { error: linkError } = await supabase
            .from("comparator_link_g_dp")
            .insert([
                { google_id: googleId, dp_id: dpRecord.id }
            ]);

        if (linkError) throw linkError;

        revalidatePath("/clean");

        // Ritorna l'intera struttura di Google con il nuovo link incluso
        return await getSingleGoogleRecord(googleId);
    } catch (error: any) {
        console.error("Errore creazione e link DP:", error.message);
        return null;
    }
}

/**
 * Modifica i dettagli di un record DocPlanner esistente e ritorna lo stato Google aggiornato
 */
export async function updateDPRecord(dpId: string, dpData: any) {
    try {
        const { error } = await supabase
            .from("comparator_out_dp")
            .update(dpData)
            .eq("id", dpId);

        if (error) throw error;

        // Recuperiamo il google_id associato a questo dpId per poter rigenerare il record Google corretto
        const { data: linkData } = await supabase
            .from("comparator_link_g_dp")
            .select("google_id")
            .eq("dp_id", dpId)
            .maybeSingle();

        revalidatePath("/clean");

        if (linkData?.google_id) {
            return await getSingleGoogleRecord(linkData.google_id);
        }
        return null;
    } catch (error: any) {
        console.error("Errore aggiornamento DP:", error.message);
        return null;
    }
}

/**
 * Elimina la relazione di collegamento tra Google e DocPlanner e ritorna lo stato aggiornato
 * NOTA: richiede anche il googleId per sapere quale record restituire post-eliminazione
 */
export async function deleteLink(linkId: string, googleId: string) {
    try {
        const { error } = await supabase
            .from("comparator_link_g_dp")
            .delete()
            .eq("id", linkId);

        if (error) throw error;

        revalidatePath("/clean");

        // Ritorna lo stato Google aggiornato (ora privo del link rimosso)
        return await getSingleGoogleRecord(googleId);
    } catch (error: any) {
        console.error("Errore rimozione link:", error.message);
        return null;
    }
}

/**
 * Estrae l'elenco pulito di categorie per alimentare il filtro multiselect
 */
export async function getUniqueGoogleCategories() {
    try {
        const { data, error } = await supabase
            .from("comparator_out_google")
            .select("google_category");

        if (error) return [];

        const categories = Array.from(
            new Set(data.map((d) => d.google_category).filter(Boolean))
        ) as string[];

        return categories.sort();
    } catch (error) {
        return [];
    }
}

/**
 * Elimina uno o più record dalla tabella Google
 */
export async function deleteGoogleRecords(ids: string[]) {
    try {
        const { error } = await supabase
            .from("comparator_out_google")
            .delete()
            .in("id", ids);

        if (error) throw error;

        revalidatePath("/clean");
        return { success: true };
    } catch (error: any) {
        console.error("Errore eliminazione record Google:", error.message);
        return { success: false, error: error.message };
    }
}