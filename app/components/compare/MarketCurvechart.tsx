"use client";

import React from "react";

interface CompetitorBase {
    name: string;
    reputation_score: number;
    total_reviews: number | null;
}

interface CurveChartProps {
    targetName: string;
    competitors: CompetitorBase[];
}

export default function MarketCurveChart({
    targetName,
    competitors,
}: CurveChartProps) {
    if (!competitors || competitors.length === 0) return null;

    // 1. Ordiniamo TUTTI i competitor del mercato per numero di recensioni (Asse X crescente)
    const sortedData = [...competitors].sort(
        (a, b) => (a.total_reviews || 0) - (b.total_reviews || 0)
    );

    const totalPoints = sortedData.length;
    const svgWidth = 300;
    const svgHeight = 100;
    const paddingY = 15; // Spazio per non far toccare il soffitto e il pavimento del grafico

    // 2. Costruiamo i punti del grafico (X = indice progressivo per recensioni, Y = reputation score)
    let pathD = "";
    let targetCoords = { x: 0, y: 0, score: 0, reviews: 0 };

    sortedData.forEach((item, index) => {
        // Calcoliamo la X distribuendo i punti in modo equo da sinistra (0 recensioni) a destra (max recensioni)
        const x = totalPoints > 1 ? (index / (totalPoints - 1)) * svgWidth : svgWidth / 2;

        // Calcoliamo la Y invertita basata sul reputation score (0-100)
        const y = svgHeight - paddingY - (item.reputation_score / 100) * (svgHeight - 2 * paddingY);

        // Registriamo le coordinate se questo punto è l'attività target
        if (item.name.trim().toLowerCase() === targetName.trim().toLowerCase()) {
            targetCoords = { x, y, score: item.reputation_score, reviews: item.total_reviews || 0 };
        }

        // Costruiamo la stringa del tracciato SVG
        if (index === 0) {
            pathD += `M ${x} ${y}`;
        } else {
            pathD += ` L ${x} ${y}`; // Linea retta da punto a punto
        }
    });

    return (
        <div className="space-y-3 pt-4 border-t border-zinc-800">
            {/* Titolo e Sottotitolo */}
            <div className="space-y-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                    Andamento Reputazione / Recensioni
                </h3>
                <p className="text-[11px] text-zinc-400">
                    La linea mostra come varia la reputazione al crescere del numero di recensioni in zona.
                </p>
            </div>

            {/* Box Grafico */}
            <div className="w-full bg-zinc-950/50 p-4 pt-6 rounded-xl border border-zinc-800/80 relative">

                {/* Asse Y Label */}
                <div className="absolute left-2 top-2 text-[7px] font-mono uppercase text-zinc-600 font-bold tracking-widest">
                    ▲ Punteggio Reputazione
                </div>

                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto overflow-visible"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Griglie di sfondo orizzontali */}
                    <line x1="0" y1={paddingY} x2={svgWidth} y2={paddingY} stroke="#18181b" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="0" y1={svgHeight / 2} x2={svgWidth} y2={svgHeight / 2} stroke="#18181b" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="0" y1={svgHeight - paddingY} x2={svgWidth} y2={svgHeight - paddingY} stroke="#27272a" strokeWidth="1" />

                    {/* LA LINEA REALE DEL MERCATO */}
                    <path
                        d={pathD}
                        stroke="#52525b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* IL SEGNALATORE DEL SELEZIONATO */}
                    {targetCoords.x !== 0 && (
                        <g>
                            {/* Linee guida tratteggiate verso gli assi */}
                            <line x1={targetCoords.x} y1={targetCoords.y} x2={targetCoords.x} y2={svgHeight - paddingY} stroke="#a1a1aa" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.5" />
                            <line x1="0" y1={targetCoords.y} x2={targetCoords.x} y2={targetCoords.y} stroke="#a1a1aa" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.5" />

                            {/* Pallino Evidenziato */}
                            <circle cx={targetCoords.x} cy={targetCoords.y} r="6" fill="#ffffff" opacity="0.2" />
                            <circle cx={targetCoords.x} cy={targetCoords.y} r="4" fill="#ffffff" stroke="#09090b" strokeWidth="1" />
                            <circle cx={targetCoords.x} cy={targetCoords.y} r="1.5" fill="#09090b" />
                        </g>
                    )}
                </svg>

                {/* Etichetta fissa in alto al centro
                {targetCoords.x !== 0 && (
                    <div
                        className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-zinc-900 text-white border border-zinc-800 font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap z-10"
                    >
                        <span className="text-zinc-400 font-normal"></span> {targetName} 🔥{targetCoords.score}  ⭐{targetCoords.reviews}
                    </div>
                )} */}

                {/* Asse X Label */}
                <div className="flex justify-between items-center mt-2 pt-1 border-t border-zinc-900 text-[7px] font-mono uppercase tracking-wider text-zinc-600 font-bold">
                    <span>meno Recensioni</span>
                    <span className="text-zinc-500 font-black">Numero di Recensioni Crescenti →</span>
                    <span>più Recensioni</span>
                </div>

            </div>
        </div>
    );
}