"use client";

import React, { useState } from "react";

// Componenti Icona interni
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
    const [showAllCompetitors, setShowAllCompetitors] = useState(false);

    if (!competitors || competitors.length === 0) return null;

    // 1. Ordiniamo i competitor dal migliore al peggiore (Reputation Score decrescente)
    const rankedCompetitors = [...competitors].sort(
        (a, b) => b.reputation_score - a.reputation_score
    );

    const totalPoints = rankedCompetitors.length;
    const maxScore = Math.max(...rankedCompetitors.map(c => c.reputation_score), 1);

    // 2. Troviamo la posizione dello studio target
    const targetRankIndex = rankedCompetitors.findIndex(
        (c) => c.name.trim().toLowerCase() === targetName.trim().toLowerCase()
    );

    const targetRank = targetRankIndex !== -1 ? targetRankIndex + 1 : null;
    const targetRecord = targetRankIndex !== -1 ? rankedCompetitors[targetRankIndex] : null;

    // Helper interno per ottenere il prefisso/medaglia corretto in base alla posizione
    const getRankPrefix = (index: number) => {
        if (index === 0) return "🥇";
        if (index === 1) return "🥈";
        if (index === 2) return "🥉";
        return `#${index + 1}`;
    };

    // Renderizza il blocco metriche diviso in 3 colonne
    const renderRowStats = (comp: CompetitorBase, isTargetRow: boolean) => {
        const gReviews = comp.total_reviews || 0;
        const mdReviews = comp.miodottore_reviews || 0;
        const gRating = comp.avg_review;
        const mdRating = comp.miodottore_avg;

        const formatRating = (rating: number | null | undefined) => {
            if (rating === null || rating === undefined || rating === 0) return null;
            return Number(rating).toFixed(1);
        };

        const formattedGIRating = formatRating(gRating);
        const formattedMdRating = formatRating(mdRating);

        const scoreColor = isTargetRow ? "text-zinc-950" : "text-white";
        const subColor = isTargetRow ? "text-zinc-700" : "text-zinc-500";

        return (
            <div className="grid grid-cols-3 gap-3 sm:gap-1 sm:w-[250px] shrink-0 font-bold font-mono text-[11px] items-center self-end sm:self-auto mt-1 sm:mt-0">
                <span className={`flex items-center justify-start font-black ${scoreColor}`}>
                    🔥 {comp.reputation_score}
                </span>

                <span className={`flex items-center justify-start gap-1 flex-wrap ${subColor}`}>
                    <GoogleIcon />
                    <span>{gReviews}</span>
                    {formattedGIRating && (
                        <span className="text-[10px] opacity-85 font-sans">({formattedGIRating})</span>
                    )}
                </span>

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
        const isPodiumPrefix = ["🥇", "🥈", "🥉"].includes(prefix);
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
                {isTargetRow && !isPodiumPrefix && prefix !== "🎖️" && <span className="shrink-0">👈</span>}
            </span>
        );
    };

    return (
        <div className="space-y-6 p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/80">

            {/* SEZIONE 1: GRAFICO A COLONNE ORIZZONTALI */}
            <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                    <span>podio del reputation score</span>
                    {totalPoints > 4 && (
                        <button
                            onClick={() => setShowAllCompetitors(!showAllCompetitors)}
                            className="text-zinc-400 hover:text-emerald-400 border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 rounded-md text-[9px] transition-all cursor-pointer font-bold uppercase"
                        >
                            {showAllCompetitors ? "vedi podio" : `vedi tutti ${totalPoints}`}
                        </button>
                    )}
                </div>
                
                <div className="space-y-2">
                    {rankedCompetitors.map((comp, index) => {
                        const isTarget = comp.name.trim().toLowerCase() === targetName.trim().toLowerCase();
                        const isPodium = index < 3;
                        
                        if (!showAllCompetitors && !isPodium && !isTarget) {
                            if (index === 3 && targetRank && targetRank > 4) {
                                return (
                                    <div key="separator" className="text-zinc-700 text-[10px] pl-2 font-bold font-mono tracking-widest py-0.5">
                                        •••
                                    </div>
                                );
                            }
                            return null;
                        }

                        const barWidth = maxScore > 0 ? (comp.reputation_score / maxScore) * 100 : 0;
                        const rankPrefix = getRankPrefix(index);
                        
                        return (
                            <div key={index} className="space-y-1 animate-in fade-in duration-200">
                                {/* Label con medaglia/numero nel nome e fiammella nello score */}
                                <div className="flex justify-between items-center text-[11px] font-mono px-0.5">
                                    <span className={`truncate max-w-[70%] ${isTarget ? "text-white font-black" : "text-zinc-400"}`}>
                                        {rankPrefix} {comp.name} {isTarget && "👈"}
                                    </span>
                                    <span className={`font-bold flex items-center gap-1 ${isTarget ? "text-emerald-400" : "text-zinc-200"}`}>
                                        🔥 {comp.reputation_score} pts
                                    </span>
                                </div>
                                
                                {/* Contenitore della barra */}
                                <div className="w-full h-3 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-900">
                                    <div
                                        className={`h-full rounded-r-xs transition-all duration-700 ease-out ${
                                            isTarget 
                                                ? "bg-linear-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
                                                : "bg-zinc-700"
                                        }`}
                                        style={{ width: `${Math.max(barWidth, 2)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SEZIONE 2: MICRO CLASSIFICA SARTORIALE DINAMICA */}
            {targetRank && (
                <div className="pt-3 border-t border-zinc-900 space-y-1.5">
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                        Analisi dettagliata distacco:
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                        {/* 1° Classificato */}
                        <div className={`p-1.5 rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 ${targetRank === 1 ? "text-zinc-950 font-black bg-white shadow-md" : "text-zinc-400"}`}>
                            {renderNameWithMap(rankedCompetitors[0], "🥇", targetRank === 1)}
                            {renderRowStats(rankedCompetitors[0], targetRank === 1)}
                        </div>

                        {/* 2° Classificato */}
                        {totalPoints > 1 && (
                            <div className={`p-1.5 rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 ${targetRank === 2 ? "text-zinc-950 font-black bg-white shadow-md" : "text-zinc-400"}`}>
                                {renderNameWithMap(rankedCompetitors[1], "🥈", targetRank === 2)}
                                {renderRowStats(rankedCompetitors[1], targetRank === 2)}
                            </div>
                        )}

                        {/* 3° Classificato */}
                        {totalPoints > 2 && (
                            <div className={`p-1.5 rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 ${targetRank === 3 ? "text-zinc-950 font-black bg-white shadow-md" : "text-zinc-400"}`}>
                                {renderNameWithMap(rankedCompetitors[2], "🥉", targetRank === 3)}
                                {renderRowStats(rankedCompetitors[2], targetRank === 3)}
                            </div>
                        )}

                        {/* Separatore intermedi */}
                        {targetRank > 3 && (
                            <div className="text-zinc-700 text-[10px] pl-4 leading-none py-0.5 font-bold">•••</div>
                        )}

                        {/* 4° posto (mostrato solo se necessario per evitare duplicati) */}
                        {targetRank > 3 && targetRankIndex !== 3 && (
                            <div className="p-1.5 text-zinc-500/80 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                {renderNameWithMap(rankedCompetitors[3], "#4", false)}
                                {renderRowStats(rankedCompetitors[3], false)}
                            </div>
                        )}

                        {/* Secondo separatore */}
                        {targetRank > 4 && (
                            <div className="text-zinc-700 text-[10px] pl-4 leading-none py-0.5 font-bold">•••</div>
                        )}

                        {/* Studio target se fuori dal podio */}
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