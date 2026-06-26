"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function CallBookingBanner() {
  const calendarUrl = "https://calendar.app.google/AoUmwjfPVyJPuGEaA";

  return (
    <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 animate-in zoom-in-95 duration-200">
      
      {/* Testo ed Branding */}
      <div className="space-y-3 max-w-xl">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            In collaborazione con
          </span>
          {/* Logo MioDottore Esteso */}
          <div className="h-5 overflow-hidden relative flex items-center">
            <img
              src="/mdlogo.svg"
              alt="MioDottore"
              className="h-5 w-auto"
            />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
          Migliora la reputazione online.
          </h3>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Come si valorizza la presenza online per cresecere con i pazienti? Prenota una call e parliamone👍
          </p>
        </div>
      </div>

      {/* Pulsante CTA di Prenotazione */}
      <div className="shrink-0 self-start md:self-center">
        <a 
          href={calendarUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block"
        >
          <Button 
            className="w-full sm:w-auto bg-[#007d68] text-zinc-50 font-mono font-bold text-xs uppercase tracking-wider px-5 h-11 rounded-md shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Prenota una call 🗓️</span>
          </Button>
        </a>
      </div>

    </div>
  );
}