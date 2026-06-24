"use client";

import React from "react";
import { ExternalLink } from "lucide-react";

// Definiamo i componenti Icona interni usando il trucco del ritaglio dell'immagine
const GoogleIcon = () => (
    <div className="w-3.5 h-3.5 shrink-0 overflow-hidden relative">
        <img
            src="/google-icon-logo.svg"
            alt="Google"
            className="max-w-none absolute left-0 top-0 w-auto h-3.5"
        />
    </div>
);

const MioDottoreIcon = () => (
    <div className="w-3.5 h-3.5 shrink-0 overflow-hidden relative">
        <img
            src="/mdlogo.svg"
            alt="MioDottore"
            className="max-w-none absolute left-0 top-0 w-auto h-3.5"
        />
    </div>
);

interface CompetitorBase {
    name: string;
    reputation_score: number;
    total_reviews?: number | null;
    avg_review?: number | null;
    miodottore_avg?: number | null;
    miodottore_reviews?: number | null;
    g_maps_link?: string | null;
    dp_link_url?: string | null;
}

interface RankTrackerProps {
    targetName: string;
    competitors: CompetitorBase[];
}

export default function MarketRankTracker({
    targetName,
    competitors,
}: RankTrackerProps) {
    if (!competitors || competitors.length === 0) return null;

    // 1. Ordiniamo i competitor dal migliore al peggiore (Reputation Score decrescente)
    const rankedCompetitors = [...competitors].sort(
        (a, b) => b.reputation_score - a.reputation_score
    );

    const totalPoints = rankedCompetitors.length;

    // 2. Troviamo la posizione dello studio target
    const targetRankIndex = rankedCompetitors.findIndex(
        (c) => c.name.trim().toLowerCase() === targetName.trim().toLowerCase()
    );

    const targetRank = targetRankIndex !== -1 ? targetRankIndex + 1 : null;
    const targetRecord = targetRankIndex !== -1 ? rankedCompetitors[targetRankIndex] : null;

    // Calcolo della posizione percentuale sulla linea (0% = Primo, 100% = Ultimo)
    const linearProgress = totalPoints > 1 && targetRank
        ? ((targetRank - 1) / (totalPoints - 1)) * 100
        : 0;

    // Renderizza il blocco metriche diviso in 3 colonne perfettamente incolonnate a sinistra
    const renderRowStats = (comp: CompetitorBase, isTargetRow: boolean) => {
        const gReviews = comp.total_reviews || 0;
        const mdReviews = comp.miodottore_reviews || 0;

        // Recuperiamo i voti medi dal database
        const gRating = comp.avg_review;
        const mdRating = comp.miodottore_avg;

        // Funzione helper interna per formattare il voto con un decimale fisso (es. 5 -> "5.0")
        const formatRating = (rating: number | null | undefined) => {
            if (rating === null || rating === undefined || rating === 0) return null;
            return Number(rating).toFixed(1);
        };

        const formattedGIRating = formatRating(gRating);
        const formattedMdRating = formatRating(mdRating);

        // Gestione colori dinamici
        const scoreColor = isTargetRow ? "text-zinc-950" : "text-white";
        const subColor = isTargetRow ? "text-zinc-700" : "text-zinc-500";

        return (
            /* Larghezza impostata a w-[250px] per ospitare comodamente i decimali aggiuntivi ".0" */
            <div className="grid grid-cols-3 gap-3 sm:gap-1 sm:w-[250px] shrink-0 font-bold font-mono text-[11px] items-center self-end sm:self-auto mt-1 sm:mt-0">
                {/* Colonna 1: Valore Sintetico */}
                <span className={`flex items-center justify-start font-black ${scoreColor}`}>
                    🔥 {comp.reputation_score}
                </span>

                {/* Colonna 2: Recensioni Google */}
                <span className={`flex items-center justify-start gap-1 flex-wrap ${subColor}`}>
                    <GoogleIcon />
                    <span>{gReviews}</span>
                    {formattedGIRating && (
                        <span className="text-[10px] opacity-85 font-sans">({formattedGIRating})</span>
                    )}
                </span>

                {/* Colonna 3: Recensioni MioDottore */}
                <span className={`flex items-center justify-start gap-1 flex-wrap ${subColor}`}>
                    <MioDottoreIcon />
                    <span>{mdReviews}</span>
                    {formattedMdRating && (
                        <span className="text-[10px] opacity-85 font-sans">({formattedMdRating})</span>
                    )}
                </span>
            </div>
        );
    };

    const renderNameWithMap = (comp: CompetitorBase, prefix: string, isTargetRow: boolean) => {
        return (
            <span className="flex items-center flex-wrap gap-1.5 min-w-0 flex-1">
                <span className="wrap-break-word sm:truncate">{prefix} {comp.name}</span>
                {comp.g_maps_link && (
                    <a
                        href={comp.g_maps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex shrink-0 items-center gap-1.5 transition-all px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs ${isTargetRow
                            ? "bg-zinc-200 border-zinc-300 text-zinc-800 hover:text-zinc-950 hover:bg-zinc-300/80 active:scale-95"
                            : "bg-zinc-800/60 border-zinc-700/50 text-zinc-200 hover:text-white hover:bg-zinc-700 hover:border-zinc-600 active:scale-95"
                            }`}
                        title="Apri su Google Maps"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span>vedi su</span>
                        <GoogleIcon />
                    </a>
                )}

                {/* Pulsante MioDottore (se presente dp_link_url) */}
                {comp.dp_link_url && (
                    <a
                        href={comp.dp_link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex shrink-0 items-center gap-1.5 transition-all px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs ${isTargetRow
                            ? "bg-zinc-200 border-zinc-300 text-zinc-800 hover:text-zinc-950 hover:bg-zinc-300/80 active:scale-95"
                            : "bg-zinc-800/60 border-zinc-700/50 text-zinc-200 hover:text-white hover:bg-zinc-700 hover:border-zinc-600 active:scale-95"
                            }`}
                        title="Apri profilo MioDottore"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span>vedi su</span>
                        <MioDottoreIcon />
                    </a>
                )}
                {isTargetRow && prefix !== "🎖️" && <span className="shrink-0">👈</span>}
            </span>
        );
    };

    return (
        <div className="space-y-5 p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/80">

            {/* SEZIONE 1: TRACKER LINEARE ORIZZONTALE */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                    <span className="text-emerald-500">🥇 1° Posto (Leader)</span>
                    <span className="text-zinc-600">Piazzamento</span>
                    <span className="text-rose-500">Ultimo posto 🔻</span>
                </div>

                <div className="relative w-full h-2 bg-zinc-900 rounded-full flex items-center border border-zinc-800">
                    <div className="absolute inset-0 bg-linear-to-r from-emerald-500/10 via-zinc-500/0 to-rose-500/10 rounded-full" />

                    {/* Cursore dello studio target */}
                    <div
                        className="absolute w-4 h-4 bg-white rounded-full border-2 border-zinc-950 shadow-xl flex items-center justify-center transition-all duration-700 ease-out"
                        style={{ left: `${linearProgress}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className="w-1.5 h-1.5 bg-zinc-950 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* SEZIONE 2: MICRO CLASSIFICA SARTORIALE DINAMICA */}
            {targetRank && (
                <div className="pt-1 border-t border-zinc-900/60 space-y-1.5">
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                        Analisi distacco dal podio:
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                        {/* Sempre il 1° Classificato */}
                        <div className={`p-1.5 rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 ${targetRank === 1 ? "text-white font-bold bg-zinc-800" : "text-zinc-400"}`}>
                            {renderNameWithMap(rankedCompetitors[0], "🥇 #1", targetRank === 1)}
                            {renderRowStats(rankedCompetitors[0], targetRank === 1)}
                        </div>

                        {/* Il 2° Classificato (se presente nel mercato) */}
                        {totalPoints > 1 && (
                            <div className={`p-1.5 rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 ${targetRank === 2 ? "text-white font-bold bg-zinc-800" : "text-zinc-400"}`}>
                                {renderNameWithMap(rankedCompetitors[1], "🥈 #2", targetRank === 2)}
                                {renderRowStats(rankedCompetitors[1], targetRank === 2)}
                            </div>
                        )}

                        {/* Il 3° Classificato (se presente nel mercato) */}
                        {totalPoints > 2 && (
                            <div className={`p-1.5 rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 ${targetRank === 3 ? "text-white font-bold bg-zinc-800" : "text-zinc-400"}`}>
                                {renderNameWithMap(rankedCompetitors[2], "🥉 #3", targetRank === 3)}
                                {renderRowStats(rankedCompetitors[2], targetRank === 3)}
                            </div>
                        )}

                        {/* Separatore di distacco se l'attività si trova dal 4° posto in giù */}
                        {targetRank > 3 && (
                            <div className="text-zinc-700 text-[10px] pl-4 leading-none py-0.5 font-bold">•••</div>
                        )}

                        {/* Mostra il 4° posto solo se l'utente è dal 5° in giù per non avere duplicati */}
                        {targetRank > 3 && targetRankIndex !== 3 && (
                            <div className="p-1.5 text-zinc-500/80 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                {renderNameWithMap(rankedCompetitors[3], "#4", false)}
                                {renderRowStats(rankedCompetitors[3], false)}
                            </div>
                        )}

                        {/* Secondo separatore si c'è un buco tra il 3° posto e la posizione effettiva dell'utente */}
                        {targetRank > 4 && (
                            <div className="text-zinc-700 text-[10px] pl-4 leading-none py-0.5 font-bold">•••</div>
                        )}

                        {/* Riga dello studio target se si trova fuori dal podio delle prime 3 posizioni */}
                        {targetRank > 3 && targetRecord && (
                            <div className="p-1.5 bg-white text-zinc-950 font-black rounded shadow-md animate-in fade-in duration-300 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                {renderNameWithMap(targetRecord, `🎖️ #${targetRank}`, true)}
                                {renderRowStats(targetRecord, true)}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}