"use server";

import { supabase } from "@/app/lib/supabaseClient";

/**
 * Riceve un array di google_place_id (estratti dal parsing dell'HTML)
 * e restituisce l'array di quelli che sono già presenti nel database.
 */
export async function checkExistingPlaceIds(placeIds: string[]): Promise<string[]> {
  // Rimuove duplicati locali dall'array e filtra stringhe vuote o 'N/D'
  const validIds = Array.from(
    new Set(placeIds.filter(id => id && id.trim() !== "" && id !== "N/D"))
  );

  if (validIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from("comparator_out_google")
      .select("google_place_id")
      .in("google_place_id", validIds);

    if (error) {
      console.error("Errore in checkExistingPlaceIds:", error.message);
      return [];
    }

    // Estrae e restituisce solo le stringhe dei place_id trovati
    return data ? data.map(row => row.google_place_id) : [];
  } catch (error: any) {
    console.error("Eccezione in checkExistingPlaceIds:", error.message);
    return [];
  }
}