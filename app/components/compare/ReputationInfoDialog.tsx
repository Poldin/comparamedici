"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export default function ReputationInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 font-mono text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
          <HelpCircle className="w-3 h-3 text-zinc-400" />
          come la misuriamo
        </button>
      </DialogTrigger>
      
      {/* Usiamo i !important (es: !fixed, !inset-0, !translate-x-0) per distruggere 
        i vecchi stili di Shadcn che centravano il dialog e lo rompevano su desktop.
      */}
      <DialogContent className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 translate-y-0! w-screen h-screen max-w-none! rounded-none! bg-zinc-950 border-none text-zinc-100 p-6 md:p-12 overflow-y-auto flex flex-col justify-start z-50">
        
        {/* Pulsante di chiusura custom per i dialog a tutto schermo (opzionale, Radix mette già il suo, ma questo garantisce visibilità in alto a destra) */}
        <div className="absolute top-6 right-6 z-50">
          <DialogPrimitive.Close className="">
          </DialogPrimitive.Close>
        </div>

        {/* Container centrale per mantenere la leggibilità */}
        <div className="w-full max-w-3xl mx-auto space-y-6 py-8">
          
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white font-sans">
            🔥reputazione online
            </DialogTitle>
            <DialogDescription className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">
              Come la misuriamo?
            </DialogDescription>
          </DialogHeader>

          <hr className="border-zinc-800" />

          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-sans">
            
            {/* Definizione Semplice */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Cos&apos;è</h4>
              <p className="text-zinc-400 text-base">
                In ambito sanitario, la reputazione online è l&apos;indice sintetico che misura il grado di fiducia, autorevolezza e presenza digitale strutturata di un professionista o di una clinica medica. Viene calcolata aggregando segnali quantitativi e qualitativi provenienti dalle principali piattaforme di recensioni e di contatto con i pazienti.
              </p>
            </div>

            {/* I 5 Criteri di Calcolo */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                Parametri di calcolo dell&apos;algoritmo
              </h4>
              
              <div className="grid grid-cols-1 gap-3">
                
                {/* 1. Google */}
                <div className="p-4 md:p-5 border border-zinc-900 bg-zinc-900/40 rounded-xl flex items-start gap-4">
                  <span className="text-sm font-mono font-bold text-zinc-600 mt-0.5">01</span>
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-bold uppercase text-white tracking-wide">Recensioni Google</div>
                    <p className="text-xs md:text-sm text-zinc-400">
                      Analisi della **numerosità totale** dei feedback, della **valutazione media** pesata e della **frequenza temporale** di rilascio (per distinguere flussi organici costanti da anomalie isolate o picchi singolari).
                    </p>
                  </div>
                </div>

                {/* 2. MioDottore */}
                <div className="p-4 md:p-5 border border-zinc-900 bg-zinc-900/40 rounded-xl flex items-start gap-4">
                  <span className="text-sm font-mono font-bold text-zinc-600 mt-0.5">02</span>
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-bold uppercase text-white tracking-wide">Recensioni MioDottore</div>
                    <p className="text-xs md:text-sm text-zinc-400">
                      Valutazione dei medesimi parametri estratti dalla piattaforma specialistica medica di riferimento, ponderando i volumi e la costanza nel tempo dei giudizi verificati dei pazienti.
                    </p>
                  </div>
                </div>

                {/* 3. Google My Business */}
                <div className="p-4 md:p-5 border border-zinc-900 bg-zinc-900/40 rounded-xl flex items-start gap-4">
                  <span className="text-sm font-mono font-bold text-zinc-600 mt-0.5">03</span>
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-bold uppercase text-white tracking-wide">Scheda Google Business Profile</div>
                    <p className="text-xs md:text-sm text-zinc-400">
                      Verifica della presenza, della completezza informativa (orari, recapiti, foto) e dell&apos;ottimizzazione del punto di contatto principale nei motori di ricerca geografici.
                    </p>
                  </div>
                </div>

                {/* 4. Sito Web */}
                <div className="p-4 md:p-5 border border-zinc-900 bg-zinc-900/40 rounded-xl flex items-start gap-4">
                  <span className="text-sm font-mono font-bold text-zinc-600 mt-0.5">04</span>
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-bold uppercase text-white tracking-wide">Sito Web Istituzionale</div>
                    <p className="text-xs md:text-sm text-zinc-400">
                      Rilevamento di un dominio web proprietario attivo, fattore cruciale per l&apos;indicizzazione e per stabilire un canale digitale ufficiale e controllato dal medico o dallo studio.
                    </p>
                  </div>
                </div>

                {/* 5. Canali Social */}
                <div className="p-4 md:p-5 border border-zinc-900 bg-zinc-900/40 rounded-xl flex items-start gap-4">
                  <span className="text-sm font-mono font-bold text-zinc-600 mt-0.5">05</span>
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-bold uppercase text-white tracking-wide">Canali Social Attivi</div>
                    <p className="text-xs md:text-sm text-zinc-400">
                      Mappatura della presenza sulle principali reti di comunicazione digitale per verificare l&apos;ampiezza del posizionamento e del raggio d&apos;azione comunicativo del brand sanitario.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}