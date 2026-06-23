"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getLocalBenchmarks } from "./actions";
import { Button } from "@/components/ui/button";
import MarketRankTracker from "./MarketRank";
import MarketCurveChart from "./MarketCurvechart";

interface BenchmarkRecord {
  id: string;
  name: string;
  google_category: string | null;
  avg_review: number | null;
  total_reviews: number | null;
  website_url: string | null;
  online_booking_url: string | null;
  g_maps_link: string | null;
  distance_km: number;
  reputation_score: number;
  address: string | null;
  phone: string | null;
}

interface Props {
  lat: number;
  lng: number;
  radius: number;
  targetName?: string;
}

export default function Dashboard({ lat, lng, radius, targetName }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [competitors, setCompetitors] = useState<BenchmarkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedTargetName = targetName ? decodeURIComponent(targetName).trim().toLowerCase() : "";

  const MioDottoreIcon = () => (
    <div className="w-5 h-5 shrink-0 overflow-hidden relative">
      <img
        src="/mdlogo.svg"
        alt="MioDottore"
        className="max-w-none absolute left-0 top-0 w-auto h-5"
      />
    </div>
  );

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: targetName ? decodeURIComponent(targetName) : "Mercato Locale",
          text: `Guarda il benchmark della reputazione online per ${targetName ? decodeURIComponent(targetName) : "Mercato Locale"}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Errore durante la condivisione:", err);
      }
    } else {
      // Fallback se la condivisione di sistema non è supportata (es. copia il link negli appunti)
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copiato negli appunti!");
      } catch (err) {
        console.error("Impossibile copiare il link:", err);
      }
    }
  };

  const GoogleIcon = () => (
    <div className="w-5 h-5 shrink-0 overflow-hidden relative">
      <img
        src="/google-icon-logo.svg"
        alt="Google"
        className="max-w-none absolute left-0 top-0 w-auto h-5"
      />
    </div>
  );

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);
      const { data, error: err } = await getLocalBenchmarks(lat, lng, radius);

      if (err) {
        setError(err);
      } else {
        setCompetitors(data || []);
      }
      setLoading(false);
    }
    loadDashboard();
  }, [lat, lng, radius]);

  const handleRadiusChange = (newRadius: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("radius", newRadius.toString());
    router.push(`?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto py-24 text-center space-y-4">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 animate-pulse">
          Aggiornamento benchmark in corso...
        </div>
        <div className="h-1 w-24 bg-zinc-100 mx-auto rounded-full overflow-hidden">
          <div className="h-full bg-zinc-800 animate-pulse w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto py-12 text-center space-y-4">
        <div className="text-xs font-mono font-bold uppercase text-red-500 bg-red-50 p-4 border border-red-200 rounded-xl">
          Errore di caricamento: {error}
        </div>
        <Button onClick={() => router.push("/")} className="bg-zinc-800 text-white rounded-lg px-4 h-10">
          Torna Indietro
        </Button>
      </div>
    );
  }

  const totalCompetitors = competitors.length;
  const avgMarketScore = totalCompetitors > 0
    ? Math.round(competitors.reduce((acc, c) => acc + c.reputation_score, 0) / totalCompetitors)
    : 0;

  // 2. CALCOLO DELLA MEDIA DELLE RECENSIONI DEL MERCATO
  const avgReviews = totalCompetitors > 0
    ? Math.round(competitors.reduce((acc, c) => acc + (c.total_reviews || 0), 0) / totalCompetitors)
    : 0;

  const targetIndex = competitors.findIndex(
    (c) => c.name.trim().toLowerCase() === decodedTargetName
  );
  const targetRank = targetIndex !== -1 ? targetIndex + 1 : null;
  const targetRecord = targetIndex !== -1 ? competitors[targetIndex] : null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 text-zinc-800 animate-in fade-in duration-300">

      {/* Intestazione Dashboard */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => router.push("/")}
            className="p-1 -ml-1 text-zinc-400 hover:text-zinc-900 rounded transition-colors text-sm font-bold flex items-center justify-center"
            title="Torna indietro"
          >
            👈 torna alla ricerca
          </button>

          <button
            onClick={handleShare}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-900 text-zinc-200 rounded-sm text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
            title="Condividi questa dashboard"
          >
            💘condividi
          </button>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 leading-none">
          {targetName ? decodeURIComponent(targetName) : "Mercato Locale"}
        </h1>
      </div>

      {/* Selettore di raggio */}
      <div className="px-1 py-1 rounded-xl bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-start gap-1">
        <div className="space-y-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">modifica il raggio di ricerca</span>
        </div>
        <div className="flex gap-1.5 bg-white p-1 rounded-lg shrink-0">
          {[5, 10, 15, 30].map((r) => (
            <button
              key={r}
              onClick={() => handleRadiusChange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${radius === r
                ? "bg-zinc-950 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
            >
              {r}km
            </button>
          ))}
        </div>
      </div>

      {/* EVIDENZIAZIONE MACRO CON IL NUOVO COMPONENTE GRAFICO */}
      {targetRank && targetRecord && (
        <div className="p-2 md:p-6 border border-zinc-800 rounded-xl bg-zinc-900 text-white space-y-5 shadow-sm animate-in zoom-in-95 duration-200">
          <div className="bg-zinc-900 text-white space-y-2 shadow-sm animate-in zoom-in-95 duration-200">

            {/* Intestazione */}
            <div className="flex justify-between items-start">
              <div className="">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
                  sintesi reputazione online
                </div>
              </div>
            </div>

            {/* IL NUMERO DI POSIZIONAMENTO GRANDE IN PRIMO PIANO */}
            <div className="py-1">
              <div className="text-5xl md:text-6xl font-black font-mono tracking-tighter text-white flex items-baseline gap-1">
                #{targetRank}
                <span className="text-xl md:text-2xl text-zinc-600 font-medium tracking-normal font-sans mx-1"> su </span>
                <span className="text-2xl md:text-3xl text-zinc-400 font-bold tracking-tight font-sans">{totalCompetitors}</span>
              </div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mt-1">
                Posizionamento rispetto alle attività simili rilevate nell'area
              </p>
            </div>

            {/* LE METRICHE DI FUOCO E STELLA APPENA SOTTO, PIÙ PICCOLE */}
            <div className="flex gap-6 pt-1">
              <div className="space-y-0.5">
                <div className="text-[9px] font-mono uppercase font-black tracking-wider text-zinc-500">
                  Reputation Score
                </div>
                <div className="text-xl font-black font-mono text-white flex items-center gap-1.5">
                  <span>🔥</span>
                  <span>{targetRecord.reputation_score}</span>
                  <span className="text-[10px] font-bold text-zinc-600 font-sans">/100</span>
                </div>
              </div>

              <div className="border-l border-zinc-800 pl-6 space-y-0.5">
                <div className="text-[9px] font-mono uppercase font-black tracking-wider text-zinc-500">
                  Recensioni Google
                </div>
                <div className="text-xl font-black font-mono text-white flex items-center gap-1.5">
                  <GoogleIcon />
                  <span>{targetRecord.total_reviews}</span>
                </div>
              </div>

              {/* MioDottore Reviews */}
              <div className="border-l border-zinc-800 pl-6 space-y-0.5">
                <div className="text-[9px] font-mono uppercase font-black tracking-wider text-zinc-500">
                  Recensioni MioDottore
                </div>
                <div className="text-xl font-black font-mono text-white flex items-center gap-1.5">
                  <MioDottoreIcon />
                  <span>{targetRecord.total_reviews}</span>
                </div>
              </div>

            </div>

          </div>

          {/* 1. Il Tracker con la micro classifica dei Top */}
          <MarketRankTracker
            targetName={decodedTargetName}
            competitors={competitors}
          />

          {/* MONTAGGIO DEL COMPONENTE CURVA */}
          <MarketCurveChart
            targetName={decodedTargetName}
            competitors={competitors}
          />
        </div>
      )}

      {/* Grid delle metriche macro (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 md:gap-4">
        <div className="p-2 md:p-5 border border-zinc-200 rounded-xl bg-white space-y-1">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">🏢Attività nel Raggio</div>
          <div className="text-3xl font-black tracking-tight">{totalCompetitors}</div>
          <div className="text-xs text-zinc-400">Competitor rilevati nell&apos;area</div>
        </div>

        <div className="p-5 border border-zinc-200 rounded-xl bg-white space-y-1">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">🤏Punteggio Medio Area</div>
          <div className="text-3xl font-black tracking-tight">
            {avgMarketScore}<span className="text-sm font-normal text-zinc-400">/100</span>
          </div>
          <div className="text-xs text-zinc-400">Livello di reputazione medio</div>
        </div>

        <div className="p-5 border border-zinc-200 rounded-xl bg-zinc-100 text-zinc-800 space-y-1">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">🌐Centro di Rilevamento</div>
          <div className="text-xs font-mono truncate pt-3 text-zinc-700 font-bold">
            {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
          </div>
          <div className="text-xs text-zinc-400">Coordinate di scansione</div>
        </div>
      </div>

      {/* Classifica e Performance */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Classifica
          </h3>
        </div>

        {totalCompetitors === 0 ? (
          <div className="p-8 border border-dashed border-zinc-200 rounded-xl text-center font-mono text-xs text-zinc-400 uppercase font-bold tracking-wider bg-white">
            Nessuna attività rilevata a questa distanza. Prova ad aumentare il raggio.
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-xl bg-white divide-y divide-zinc-100 overflow-hidden">
            {competitors.map((item, index) => {
              const isTarget = item.name.trim().toLowerCase() === decodedTargetName;
              const medalEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${isTarget ? "bg-zinc-100/80 border-l-4 border-zinc-950" : "hover:bg-zinc-50/40"
                    }`}
                >
                  <div className="space-y-1.5 max-w-md truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-400 w-6 flex items-center justify-center">
                        {medalEmoji ? (
                          <span className="text-lg" title={`${index + 1}° Classificato`}>
                            {medalEmoji}
                          </span>
                        ) : (
                          `#${index + 1}`
                        )}
                      </span>
                      <h4 className="font-bold text-sm text-zinc-900 uppercase tracking-tight truncate flex items-center gap-2">
                        {item.name}
                        {isTarget && (
                          <span className="bg-zinc-950 text-white text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded tracking-wider">
                            🔥🔥🔥
                          </span>
                        )}
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] font-mono text-zinc-400 font-bold uppercase pl-8">
                      <span className="text-zinc-600">{item.google_category || "Generico"}</span>
                      <span>•</span>
                      <span>{item.distance_km.toFixed(1)} km</span>
                      {item.avg_review && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-700">★ {item.avg_review.toFixed(1)} ({item.total_reviews} rec.)</span>
                        </>
                      )}
                    </div>

                    {(item.address || item.phone || item.g_maps_link) && (
                      <div className="pl-8 text-[11px] text-zinc-400 font-mono space-y-0.5 leading-tight">
                        {item.address && <div className="truncate">📍 {item.address}</div>}
                        {item.phone && <div>📞 {item.phone}</div>}
                        {item.g_maps_link && (
                          <div className="pt-0.5">
                            <a
                              href={item.g_maps_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-zinc-900 hover:underline inline-flex items-center gap-1 font-bold uppercase text-[10px] tracking-wider"
                            >
                              🗺️ Vedi su Google Maps ↗
                            </a>
                          </div>
                        )}
                        {!isTarget && (
                          <a
                            href={`/?lat=${lat}&lng=${lng}&radius=${radius}&name=${encodeURIComponent(item.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-950 hover:underline inline-flex items-center gap-1 font-black uppercase text-[10px] tracking-wider"
                          >
                            📊 Apri Valutazione ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right space-y-1 min-w-[160px] pl-8 sm:pl-0">
                    <div className="flex justify-between sm:justify-end items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 sm:hidden">Reputation Score:</span>
                      <span className="font-mono font-black text-sm text-zinc-900">
                        {item.reputation_score}<span className="text-[10px] font-normal text-zinc-400">/100</span>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-zinc-800 h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.reputation_score}%` }}
                      />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}