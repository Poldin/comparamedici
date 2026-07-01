"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Copy, Check } from "lucide-react";
import { getLocalBenchmarks } from "../compare/actions";

interface SideMailPanelProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    recipientEmail: string;
    recordData: any;
    onLogMailSent: (recordId: string, templateType: string) => Promise<boolean>;
}

// Interfaccia interna per tipizzare i dati del podio
interface PodiumMember {
    name: string;
    rank: number;
    score: number;
    reviews: number;
    isTarget: boolean;
}

interface RankInfoType {
    rank: number;
    total: number;
    score: number;
    podium: PodiumMember[];
}

export function SideMailPanel({
    isOpen,
    onOpenChange,
    recipientEmail,
    recordData,
    onLogMailSent
}: SideMailPanelProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>("template_1");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    const [rankInfo, setRankInfo] = useState<RankInfoType | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [copiedField, setCopiedField] = useState<{ [key: string]: boolean }>({});

    const handleCopy = async (text: string, fieldKey: string) => {
        if (!text) return;
        try {
            if (fieldKey === "body") {
                const htmlText = text.replace(/\n/g, "<br />");
                const blobHtml = new Blob([htmlText], { type: "text/html" });
                const blobText = new Blob([text], { type: "text/plain" });

                await navigator.clipboard.write([
                    new ClipboardItem({
                        "text/html": blobHtml,
                        "text/plain": blobText,
                    }),
                ]);
            } else {
                await navigator.clipboard.writeText(text);
            }

            setCopiedField((prev) => ({ ...prev, [fieldKey]: true }));
            setTimeout(() => setCopiedField((prev) => ({ ...prev, [fieldKey]: false })), 3000);
        } catch (err) {
            console.error("Errore durante la copia negli appunti:", err);
            try {
                await navigator.clipboard.writeText(text);
                setCopiedField((prev) => ({ ...prev, [fieldKey]: true }));
                setTimeout(() => setCopiedField((prev) => ({ ...prev, [fieldKey]: false })), 3000);
            } catch (e) {
                console.error("Fallback fallito:", e);
            }
        }
    };

    // Funzione stabile per generare i testi dei template con blocco classifica
    const generateMailTexts = useCallback((template: string, data: any, info: RankInfoType) => {
        if (!data) return;
        const nomeAttivita = data.name || "Spett.le Struttura";
        const linkAnalisi = `${window.location.origin}/clinic/${data.id}`;

        // Costruiamo la stringa testuale della classifica / podio
        const medaglie = ["🥇", "🥈", "🥉"];
        let tabellaClassifica = "";

        info.podium.forEach((member, idx) => {
            const prefisso = idx < 3 ? medaglie[idx] : `#${member.rank}`;
            const markerVoi = member.isTarget ? " (Voi 👈)" : "";
            tabellaClassifica += `${prefisso}#${member.rank} <b>${member.name}</b>${markerVoi} ->   🔥 ${member.score} punti e ${member.reviews} recensioni\n\n`;
        });

        // Se l'utente è fuori dai primi 3, mostriamo lo stacco visivo
        if (info.rank > 3) {
            tabellaClassifica += `•••\n🎖️ #${info.rank} <b>${nomeAttivita}</b> (Voi 👈) ->   🔥 ${info.score} punti e ${data.total_reviews || 0} recensioni\n\n`;
        }

        if (template === "template_1") {
            setSubject(`Analisi della reputazione online per ${nomeAttivita}`);
            setBody(
                `Gentilissimi,

abbiamo analizzato la reputazione online di studi e cliniche dentistiche nel raggio di 15km dal vostro centro.
Dai dati online rilevati (presenza sito web, recensioni Google e MioDottore, canali social, ecc.), su un <b>totale di ${info.total} centri</b>, la situazione attuale vede questo posizionamento:

${tabellaClassifica}
Trovate l'analisi aggiornata e verificabile a questo link:
👉 <a href="${linkAnalisi}" target="_blank">${linkAnalisi}</a>



Per approfondire il dato e migliorare l'attrattività verso nuovi pazienti, sentiamoci: trovate i miei riferimenti in firma.
Vi saluto e vi auguro buon lavoro,
Paolo`
            );
        } else {
            setSubject(`Analisi Reputazione Digitale - ${nomeAttivita}`);
            setBody(
                `Buongiorno Team di ${nomeAttivita},

vi contatto per condividere un estratto emerso dal nostro ultimo osservatorio locale: nella vostra area geografica (raggio 15km) sono stati mappati ben ${info.total} competitor diretti nel settore dentistico.

Ecco come si configurano le prime posizioni e dove vi collocate attualmente:

${tabellaClassifica}
Abbiamo notato che ottimizzando i canali Google e MioDottore c'è un forte potenziale di crescita inespresso, elementi che oggi influenzano fino all'80% delle scelte e delle prenotazioni dei pazienti della vostra zona.

Potete consultare il report interattivo e tutti i dettagli qui:
${linkAnalisi}

Sarei felice di illustrarvi gratuitamente le azioni rapide per scalare la classifica locale in una breve chiamata di 5 minuti questa settimana. Avete disponibilità per giovedì o venerdì?

Un cordiale saluto,
Paolo`
            );
        }
    }, []);

    // Svuota o carica il template memorizzato alla chiusura/apertura
    useEffect(() => {
        if (isOpen) {
            const savedTemplate = localStorage.getItem("preferred_mail_template");
            if (savedTemplate) {
                setSelectedTemplate(savedTemplate);
            }
        } else {
            setSubject("");
            setBody("");
            setRankInfo(null);
            setIsLoadingData(false);
            setCopiedField({});
        }
    }, [isOpen]);

    // Effetto di caricamento e calcolo delle classifiche
    useEffect(() => {
        async function calculateRankingAndGenerateMail() {
            if (!isOpen || !recordData?.id) return;

            setIsLoadingData(true);

            const latitude = recordData.lat || 0;
            const longitude = recordData.lng || 0;

            try {
                const response = await getLocalBenchmarks(latitude, longitude, 15);

                if (response && response.data) {
                    // Ordiniamo l'array esattamente come fa MarketRankTracker (Reputation score decrescente)
                    const sortedList = [...response.data].sort(
                        (a, b) => b.reputation_score - a.reputation_score
                    );
                    
                    const totalCompetitors = sortedList.length;
                    const currentIndex = sortedList.findIndex((item) => String(item.id) === String(recordData.id));

                    const rank = currentIndex !== -1 ? currentIndex + 1 : totalCompetitors || 1;
                    const currentScore = currentIndex !== -1 ? sortedList[currentIndex].reputation_score : 0;

                    // Estraiamo i primi 3 per il podio
                    const top3 = sortedList.slice(0, 3).map((item, idx) => ({
                        name: item.name,
                        rank: idx + 1,
                        score: item.reputation_score,
                        reviews: (item.total_reviews || 0) + (item.miodottore_reviews || 0),
                        isTarget: String(item.id) === String(recordData.id)
                    }));

                    const info: RankInfoType = { 
                        rank, 
                        total: totalCompetitors || 1, 
                        score: currentScore,
                        podium: top3
                    };

                    setRankInfo(info);
                    generateMailTexts(selectedTemplate, recordData, info);
                } else {
                    const fallback = { rank: 1, total: 1, score: 0, podium: [] };
                    setRankInfo(fallback);
                    generateMailTexts(selectedTemplate, recordData, fallback);
                }
            } catch (err) {
                console.error("Errore nel calcolo del benchmark per la mail:", err);
                const fallback = { rank: 1, total: 1, score: 0, podium: [] };
                setRankInfo(fallback);
                generateMailTexts(selectedTemplate, recordData, fallback);
            } finally {
                setIsLoadingData(false);
            }
        }

        calculateRankingAndGenerateMail();
    }, [isOpen, recordData?.id, recordData?.lat, recordData?.lng, selectedTemplate, generateMailTexts]);

    const handleTemplateChange = (value: string) => {
        setSelectedTemplate(value);
        localStorage.setItem("preferred_mail_template", value);
        if (recordData && rankInfo) {
            generateMailTexts(value, recordData, rankInfo);
        }
    };

    const handleSendAndTrack = async () => {
        if (!recordData?.id) return;
        const success = await onLogMailSent(recordData.id, selectedTemplate);
        if (success) {
            onOpenChange(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            {/* Mantieni la UI invariata (Content, Input, Textarea, Button) */}
            <SheetContent className="w-full md:w-[45%] max-w-full md:max-w-[45%] overflow-y-auto space-y-5 bg-white p-6">
                <SheetHeader>
                    <SheetTitle className="text-slate-900 font-bold">Generatore e Tracciamento Mail</SheetTitle>
                    <SheetDescription>
                        Seleziona il modello predefinito. Copia i campi usando i tasti rapidi ed esegui il tracciamento al termine.
                    </SheetDescription>
                </SheetHeader>

                <Tabs value={selectedTemplate} onValueChange={handleTemplateChange} className="w-full">
                    <TabsList className="grid w-fit grid-cols-2 bg-slate-100 p-1 rounded-lg">
                        <TabsTrigger value="template_1" className="text-xs flex items-center gap-1">
                            {isLoadingData && <Loader2 className="w-3 h-3 animate-spin" />}
                            T1 (Classifica + Podio)
                        </TabsTrigger>
                        <TabsTrigger value="template_2" className="text-xs">
                            T2 (Business + Distacco)
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="space-y-4 pt-2">
                    {isLoadingData && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Elaborazione del posizionamento e del podio locale...
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-600 block">Destinatario</label>
                            <button type="button" onClick={() => handleCopy(recipientEmail, "recipient")} className="text-xs flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors">
                                {copiedField["recipient"] ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500 font-medium">Copiato!</span></> : <><Copy className="w-3 h-3" /><span>Copia rapida</span></>}
                            </button>
                        </div>
                        <Input value={recipientEmail} disabled className="bg-slate-50 text-slate-500 font-medium" />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-600 block">Oggetto</label>
                            <button type="button" onClick={() => handleCopy(subject, "subject")} disabled={!subject} className="text-xs flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50">
                                {copiedField["subject"] ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500 font-medium">Copiato!</span></> : <><Copy className="w-3 h-3" /><span>Copia rapida</span></>}
                            </button>
                        </div>
                        <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-white" placeholder="Generazione oggetto..." />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-600 block">Corpo del Messaggio</label>
                            <button type="button" onClick={() => handleCopy(body, "body")} disabled={!body} className="text-xs flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50">
                                {copiedField["body"] ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500 font-medium">Copiato!</span></> : <><Copy className="w-3 h-3" /><span>Copia rapida</span></>}
                            </button>
                        </div>
                        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={18} className="bg-white font-mono text-xs leading-relaxed" placeholder="Generazione testo..." />
                    </div>
                </div>

                <Button onClick={handleSendAndTrack} disabled={isLoadingData || !rankInfo} className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs py-5 font-semibold disabled:bg-slate-300">
                    <Send className="w-4 h-4" /> Traccia Invio Mail
                </Button>
            </SheetContent>
        </Sheet>
    );
}