"use client";

import React from "react";

interface MatrixProps {
  reputationScore: number;
  totalReviews: number;
  avgReviews: number;
}

export default function MarketPositionMatrix({
  reputationScore,
  totalReviews,
  avgReviews,
}: MatrixProps) {
  // Soglie per determinare il quadrante
  const isHighScore = reputationScore >= 50; 
  const isHighReviews = totalReviews >= avgReviews;

  // Logica per i testi descrittivi
  let title = "";
  let desc = "";
  if (isHighScore && isHighReviews) {
    title = "🏆 Leader di Mercato";
    desc = "Alta qualità e massima autorità nella zona.";
  } else if (isHighScore && !isHighReviews) {
    title = "💎 Gemma Nascosta";
    desc = "Ottima reputazione, ma hai poche recensioni rispetto alla media.";
  } else if (!isHighScore && isHighReviews) {
    title = "⚠️ Gigante Vulnerabile";
    desc = "Molto visibile (tante recensioni), ma il punteggio è sotto la media.";
  } else {
    title = "💤 Profilo Marginale";
    desc = "Punteggio basso e poche recensioni. C'è molto da lavorare.";
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-t border-zinc-800 pt-4">
      {/* Testo esplicativo */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
          Analisi incrociata (Qualità vs Quantità)
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Incrociando il tuo <span className="text-white font-bold">Reputation Score</span> con il volume di recensioni (media di zona: {avgReviews}), il tuo posizionamento è quello di un{" "}
          <span className="text-white font-black underline decoration-zinc-500 underline-offset-4">
            {title.split(" ")[1]}
          </span>
          .
        </p>
        <p className="text-[11px] text-zinc-500 italic">{desc}</p>
      </div>

      {/* Grafico a Quadranti 2x2 */}
      <div className="w-full max-w-[240px] mx-auto aspect-square grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 bg-zinc-950 rounded-xl relative border border-zinc-800">
        {/* Etichette degli Assi */}
        <div className="absolute -left-1 top-1/2 -rotate-90 origin-left -translate-y-1/2 text-[8px] font-mono uppercase text-zinc-600 font-bold tracking-widest">
          Score →
        </div>
        <div className="absolute bottom-[-14px] left-1/2 -translate-x-1/2 text-[8px] font-mono uppercase text-zinc-600 font-bold tracking-widest whitespace-nowrap">
          Recensioni →
        </div>

        {/* Quadrante: Gemma Nascosta (Alto Score, Basse Recensioni) */}
        <div
          className={`rounded-lg p-2 flex flex-col justify-between transition-all ${
            isHighScore && !isHighReviews
              ? "bg-white text-zinc-900 shadow-lg scale-[1.03] z-10 font-bold"
              : "bg-zinc-900/40 text-zinc-600 border border-zinc-800/60"
          }`}
        >
          <span className="text-[9px] font-mono uppercase tracking-tight">Gemma</span>
          <span className="text-right text-xs">{isHighScore && !isHighReviews ? "🎯" : "💎"}</span>
        </div>

        {/* Quadrante: Leader (Alto Score, Alte Recensioni) */}
        <div
          className={`rounded-lg p-2 flex flex-col justify-between transition-all ${
            isHighScore && isHighReviews
              ? "bg-white text-zinc-900 shadow-lg scale-[1.03] z-10 font-bold"
              : "bg-zinc-900/40 text-zinc-600 border border-zinc-800/60"
          }`}
        >
          <span className="text-[9px] font-mono uppercase tracking-tight">Leader</span>
          <span className="text-right text-xs">{isHighScore && isHighReviews ? "🎯" : "🏆"}</span>
        </div>

        {/* Quadrante: Marginale (Basso Score, Basse Recensioni) */}
        <div
          className={`rounded-lg p-2 flex flex-col justify-between transition-all ${
            !isHighScore && !isHighReviews
              ? "bg-white text-zinc-900 shadow-lg scale-[1.03] z-10 font-bold"
              : "bg-zinc-900/40 text-zinc-600 border border-zinc-800/60"
          }`}
        >
          <span className="text-[9px] font-mono uppercase tracking-tight">Marginale</span>
          <span className="text-right text-xs">{!isHighScore && !isHighReviews ? "🎯" : "💤"}</span>
        </div>

        {/* Quadrante: Vulnerabile (Basso Score, Alte Recensioni) */}
        <div
          className={`rounded-lg p-2 flex flex-col justify-between transition-all ${
            !isHighScore && isHighReviews
              ? "bg-white text-zinc-900 shadow-lg scale-[1.03] z-10 font-bold"
              : "bg-zinc-900/40 text-zinc-600 border border-zinc-800/60"
          }`}
        >
          <span className="text-[9px] font-mono uppercase tracking-tight">Vulnerabile</span>
          <span className="text-right text-xs">{!isHighScore && isHighReviews ? "🎯" : "⚠️"}</span>
        </div>
      </div>
    </div>
  );
}