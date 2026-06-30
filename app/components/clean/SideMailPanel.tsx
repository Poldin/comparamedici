"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Copy, Check } from "lucide-react"; // Importate icone per la copia
import { getLocalBenchmarks } from "../compare/actions";

interface SideMailPanelProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    recipientEmail: string;
    recordData: any;
    onLogMailSent: (recordId: string, templateType: string) => Promise<boolean>;
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
    
    const [rankInfo, setRankInfo] = useState<{ rank: number; total: number; score: number } | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Stati per gestire il feedback di copia di 3 secondi per ciascun campo
    const [copiedField, setCopiedField] = useState<{ [key: string]: boolean }>({});

    // Funzione helper per copiare negli appunti con feedback temporizzato
    const handleCopy = async (text: string, fieldKey: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField((prev) => ({ ...prev, [fieldKey]: true }));
            
            // Rimuove il feedback dopo 3 secondi
            setTimeout(() => {
                setCopiedField((prev) => ({ ...prev, [fieldKey]: false }));
            }, 3000);
        } catch (err) {
            console.error("Errore durante la copia negli appunti:", err);
        }
    };

    // Funzione stabile per generare i testi dei template
    const generateMailTexts = useCallback((template: string, data: any, info: { rank: number; total: number; score: number }) => {
        if (!data) return;
        const nomeAttivita = data.name || "Spett.le Struttura";
        const linkAnalisi = `${window.location.origin}/clinic/${data.id}`;

        if (template === "template_1") {
            setSubject(`${nomeAttivita}: siete classificati 🥇${info.rank} su ${info.total} studi dentistici attorno a voi`);
            setBody(
`Gentilissimi,
abbiamo analizzato la reputazione online di studi e cliniche dentistiche nel raggio di 15km dal vostro centro.
Dai dati online (presenza sito web, recensioni Google e MioDottore, presenza di social, etc.) totalizzate 🔥${info.score} punti di reputazione che corrispondono alla posizione 🥇${info.rank} su ${info.total} centri dentistici totali rilevati nella vostra area.


Trovate l'analisi completa e verificabile a questo link: 
👉 ${linkAnalisi}
(modificate il raggio di 15km per vedere come vi posizionate rispetto a concorrenti più vicini o lontani)




Per approfondire il dato e migliorare in classifica (= migliorare l'attrattività verso nuovi pazienti) potete prenotare con me una video call al link in firma oppure chiamarmi.
vi saluto e vi auguro buon lavoro
Paolo`
            );
        } else {
            setSubject(`Analisi Reputazione Digitale - ${nomeAttivita}`);
            setBody(
`Buongiorno Team di ${nomeAttivita},

vi contatto per condividere un dato emerso dal nostro ultimo osservatorio locale: nella vostra area geografica (raggio 15km) sono stati mappati ben ${info.total} competitor diretti.

Attualmente la vostra struttura si posiziona al gradino #${info.rank} con un punteggio di reputazione di ${info.score}/100. 

Abbiamo notato un forte potenziale di crescita ottimizzando i canali Google e MioDottore, elementi che oggi influenzano fino all'80% delle prenotazioni dei pazienti.

Potete consultare il report interattivo e i dettagli del vostro posizionamento qui:
${linkAnalisi}

Sarei felice di illustrarvi gratuitamente le azioni rapide per scalare la classifica locale in una breve chiamata di 5 minuti questa settimana. Avete disponibilità per giovedì o venerdì?

Un cordiale saluto,

Paolo`
            );
        }
    }, []);

    // Svuota o carica il template memorizzato quando cambia lo stato di apertura
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
            setCopiedField({}); // Resetta i feedback di copia alla chiusura
        }
    }, [isOpen]);

    // Effetto di caricamento dati: tollerante se lat/lng mancano temporaneamente
    useEffect(() => {
        async function calculateRankingAndGenerateMail() {
            if (!isOpen || !recordData?.id) return;
            
            setIsLoadingData(true);
            
            const latitude = recordData.lat || 0;
            const longitude = recordData.lng || 0;

            try {
                const response = await getLocalBenchmarks(latitude, longitude, 15);
                
                if (response && response.data) {
                    const list = response.data;
                    const totalCompetitors = list.length;
                    
                    const currentIndex = list.findIndex((item) => String(item.id) === String(recordData.id));
                    
                    const rank = currentIndex !== -1 ? currentIndex + 1 : totalCompetitors || 1;
                    const currentScore = currentIndex !== -1 ? list[currentIndex].reputation_score : 0;

                    const info = { rank, total: totalCompetitors || 1, score: currentScore };
                    setRankInfo(info);

                    generateMailTexts(selectedTemplate, recordData, info);
                } else {
                    const fallbackInfo = { rank: 1, total: 1, score: 0 };
                    setRankInfo(fallbackInfo);
                    generateMailTexts(selectedTemplate, recordData, fallbackInfo);
                }
            } catch (err) {
                console.error("Errore nel calcolo del benchmark per la mail:", err);
                const fallbackInfo = { rank: 1, total: 1, score: 0 };
                setRankInfo(fallbackInfo);
                generateMailTexts(selectedTemplate, recordData, fallbackInfo);
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

        const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        const link = document.createElement("a");
        link.href = mailtoUrl;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const success = await onLogMailSent(recordData.id, selectedTemplate);
        if (success) {
            onOpenChange(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full md:w-[45%] max-w-full md:max-w-[45%] overflow-y-auto space-y-5 bg-white p-6">
                <SheetHeader>
                    <SheetTitle className="text-slate-900 font-bold">Generatore e Tracciamento Mail</SheetTitle>
                    <SheetDescription>
                        Seleziona il modello predefinito. Al click sul pulsante si aprirà la mail precompilata nel tuo client e l'invio verrà salvato.
                    </SheetDescription>
                </SheetHeader>

                <Tabs value={selectedTemplate} onValueChange={handleTemplateChange} className="w-full">
                    <TabsList className="grid w-fit grid-cols-2 bg-slate-100 p-1 rounded-lg">
                        <TabsTrigger value="template_1" className="text-xs flex items-center gap-1">
                            {isLoadingData && <Loader2 className="w-3 h-3 animate-spin" />}
                            T1 (Classifica)
                        </TabsTrigger>
                        <TabsTrigger value="template_2" className="text-xs">
                            T2 (Business)
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="space-y-4 pt-2">
                    {isLoadingData && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Elaborazione del posizionamento locale basato sui competitor...
                        </div>
                    )}

                    {/* Destinatario */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-600 block">Destinatario</label>
                            <button
                                type="button"
                                onClick={() => handleCopy(recipientEmail, "recipient")}
                                className="text-xs flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                {copiedField["recipient"] ? (
                                    <>
                                        <Check className="w-3 h-3 text-emerald-500" />
                                        <span className="text-emerald-500 font-medium">Copiato!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copia rapida</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <Input value={recipientEmail} disabled className="bg-slate-50 text-slate-500 font-medium" />
                    </div>

                    {/* Oggetto */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-600 block">Oggetto</label>
                            <button
                                type="button"
                                onClick={() => handleCopy(subject, "subject")}
                                disabled={!subject}
                                className="text-xs flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                            >
                                {copiedField["subject"] ? (
                                    <>
                                        <Check className="w-3 h-3 text-emerald-500" />
                                        <span className="text-emerald-500 font-medium">Copiato!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copia rapida</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-white" placeholder="Generazione oggetto..." />
                    </div>

                    {/* Corpo del Messaggio */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-600 block">Corpo del Messaggio</label>
                            <button
                                type="button"
                                onClick={() => handleCopy(body, "body")}
                                disabled={!body}
                                className="text-xs flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                            >
                                {copiedField["body"] ? (
                                    <>
                                        <Check className="w-3 h-3 text-emerald-500" />
                                        <span className="text-emerald-500 font-medium">Copiato!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copia rapida</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <Textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={16}
                            className="bg-white font-mono text-xs leading-relaxed"
                            placeholder="Generazione testo..."
                        />
                    </div>
                </div>

                <Button 
                    onClick={handleSendAndTrack} 
                    disabled={isLoadingData || !rankInfo}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs py-5 font-semibold disabled:bg-slate-300"
                >
                    <Send className="w-4 h-4" /> Apri Client & Traccia Invio
                </Button>
            </SheetContent>
        </Sheet>
    );
}