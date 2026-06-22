"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-10 w-full bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-sans mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-6 animate-in fade-in duration-300">
        
        {/* Sezione Superiore: Info Brand e Link Rapidi */}
        <div className="items-start gap-6 sm:gap-4">
          
          {/* Brand & Mission sintetica */}
          <div className="space-y-1.5 max-w-sm">
            <h2 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-none">
              Compara Medici
            </h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-normal">
              Analisi e benchmark della reputazione online per specialisti, cliniche e strutture sanitarie locali.
            </p>
          </div>

          {/* Link di Navigazione / Legali */}
          <div className="flex flex-wrap pt-2 md:pt-4 gap-x-6 gap-y-2 text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <Link 
              href="/" 
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cerca
            </Link>
            <Link 
              href="/privacy" 
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/cookie" 
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cookie Policy
            </Link>
            <a 
              href="mailto:paolo.piccoli@docplanner.com" 
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Contatti
            </a>
          </div>
        </div>

        {/* Separatore minimale */}
        <div className="h-[1px] w-full bg-zinc-100 dark:bg-zinc-900" />

        {/* Sezione Inferiore: Note Legali e Fonti */}
        <div className="md:items-center justify-between gap-3 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          
          {/* Note sui Dati per dare massima professionalità */}
          <div className="leading-relaxed max-w-xl">
            I dati sul posizionamento e le recensioni sono basati su scansioni pubbliche geolocalizzate di terze parti (Google, MioDottore). Non costituiscono un giudizio clinico.
          </div>

          {/* Copyright */}
          <div className="shrink-0 font-bold text-zinc-500 dark:text-zinc-400">
            © {currentYear} — COMPARA MEDICI
          </div>
          
        </div>
      </div>
    </footer>
  );
}