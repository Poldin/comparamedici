// app/api/studios/upsert/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(request: Request) {
  try {
    const { records } = await request.json();

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
    }

    // Mappiamo i dati provenienti dal frontend con i campi del DB
    const rowsToUpsert = records.map((studio: any) => {
      // Pulizia e parsing dei dati numerici
      const avgReview = parseFloat(studio.rating) || null;
      const totalReviews = parseInt(studio.recensioni, 10) || 0;
      
      // Estraiamo il place ID dall'URL se disponibile
      const idMatch = studio.mapsUrl?.match(/1s(0x[a-f0-9]+)/);
      const googlePlaceId = idMatch ? idMatch[1] : null;

      // --- ESTRAZIONE LATITUDINE E LONGITUDINE ---
      // Supporta sia { lat, lng } che { latitude, longitude }
      const rawLat = studio.coordinate?.lat ?? studio.coordinate?.latitude;
      const rawLng = studio.coordinate?.lng ?? studio.coordinate?.longitude;
      
      const lat = rawLat !== undefined && rawLat !== null ? parseFloat(rawLat) : null;
      const lng = rawLng !== undefined && rawLng !== null ? parseFloat(rawLng) : null;
      // -------------------------------------------

      return {
        name: studio.nome,
        google_category: studio.categoria !== 'N/D' ? studio.categoria : null,
        g_maps_link: studio.mapsUrl !== 'N/D' ? studio.mapsUrl : null,
        phone: studio.telefono !== 'N/D' ? studio.telefono : null,
        website_url: studio.sitoWeb !== 'N/D' ? studio.sitoWeb : null,
        online_booking_url: studio.haPrenotazione ? studio.linkPrenotazione : null,
        address: studio.indirizzo !== 'N/D' ? studio.indirizzo : null,
        avg_review: avgReview === null || isNaN(avgReview) ? null : avgReview,
        total_reviews: isNaN(totalReviews) ? null : totalReviews,
        geo_coordinates: studio.coordinate,
        lat: isNaN(lat as number) ? null : lat, 
        lng: isNaN(lng as number) ? null : lng, 
        google_place_id: googlePlaceId, 
        updated_at: new Date().toISOString(),
      };
    });

    // Filtriamo i record che NON hanno un google_place_id
    const validRows = rowsToUpsert.filter(row => row.google_place_id !== null);

    // RIMOZIONE DUPLICATI INTERNI: Teniamo solo il PRIMO record incontrato
    const uniqueRowsMap = new Map();
    validRows.forEach(row => {
      // Se l'id non è ancora presente nella mappa, lo inseriamo.
      if (!uniqueRowsMap.has(row.google_place_id)) {
        uniqueRowsMap.set(row.google_place_id, row);
      }
    });

    // Riconvertiamo la mappa in un array pronto per l'UPSERT
    const finalRowsToUpsert = Array.from(uniqueRowsMap.values());

    if (finalRowsToUpsert.length === 0) {
      return NextResponse.json({ message: 'Nessun record valido con Place ID trovato.' }, { status: 400 });
    }

    // Eseguiamo l'UPSERT massivo su Supabase / Postgres con l'array pulito
    const { data, error } = await supabase
      .from('comparator_out_google')
      .upsert(finalRowsToUpsert, { 
        onConflict: 'google_place_id',
        ignoreDuplicates: false 
      });

    if (error) throw error;

    // Calcoliamo quanti duplicati interni sono stati scartati prima del DB
    const duplicatiScartati = validRows.length - finalRowsToUpsert.length;

    return NextResponse.json({ 
      success: true, 
      message: `Elaborati con successo ${finalRowsToUpsert.length} record (Inseriti o Aggiornati). Scartati ${duplicatiScartati} duplicati.` 
    });

  } catch (error: any) {
    console.error('Errore durante l\'upsert:', error);
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}