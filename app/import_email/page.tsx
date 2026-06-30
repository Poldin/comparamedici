"use client";

import { useState } from "react";
import { checkEmailsBeforeImport, importEmailsFromJson, CheckedRecord, ImportResult } from "./actions";

// Estendiamo l'interfaccia localmente per includere l'indirizzo del DB se l'azione lo passa
interface ExtendedCheckedRecord extends CheckedRecord {
    indirizzo_db?: string | null;
    indirizzo_json?: string; // se l'azione non lo passa, lo recuperiamo dal ciclo o lo estendiamo
}

export default function ImportEmailPage() {
    const [jsonInput, setJsonInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<ExtendedCheckedRecord[]>([]);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [uiError, setUiError] = useState<string | null>(null);

    // FASE 1: Verifica preliminare
    const handleVerify = async () => {
        setLoading(true);
        setUiError(null);
        setImportResult(null);
        setPreviewData([]);

        try {
            const parsedJson = JSON.parse(jsonInput);
            if (!Array.isArray(parsedJson)) {
                setUiError("Il JSON deve essere un array di oggetti.");
                setLoading(false);
                return;
            }

            const res = await checkEmailsBeforeImport(parsedJson);
            if (res.error) {
                setUiError(res.error);
            } else {
                // Mappiamo i dati iniettando anche l'indirizzo del JSON originale per comodità di lettura nella tabella
                const enrichedData = res.data.map((item, idx) => ({
                    ...item,
                    indirizzo_json: parsedJson[idx]?.indirizzo || "",
                    // Se la tua azione restituisce già l'indirizzo db come proprietà extra (es. address), la usiamo, altrimenti usiamo il cast
                    indirizzo_db: (item as any).indirizzo_db || (item as any).address || null
                }));
                setPreviewData(enrichedData);
            }
        } catch (e: any) {
            setUiError(`JSON non valido: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Funzione per forzare l'accettazione manuale di un record escluso
    const handleForceAccept = (index: number) => {
        setPreviewData(prev => prev.map((row, idx) => {
            if (idx === index) {
                return { ...row, status: "disponibile" };
            }
            return row;
        }));
    };

    // FASE 2: Conferma scrittura (Invia il JSON modificato o si basa sui record approvati)
    const handleConfirmImport = async () => {
        setLoading(true);
        setUiError(null);

        try {
            // Per supportare le approvazioni manuali fatte a schermo, ricostruiamo l'input 
            // filtrando solo gli elementi che l'utente ha validato (o l'algoritmo ha dato disponibili)
            const parsedJson = JSON.parse(jsonInput);
            
            // Filtriamo il JSON originale mantenendo solo quelli che nella preview risultano "disponibili"
            const validJsonInputs = parsedJson.filter((_: any, idx: number) => {
                return previewData[idx]?.status === "disponibile";
            });

            if (validJsonInputs.length === 0) {
                setUiError("Nessun record contrassegnato come 'Importabile' da scrivere a DB.");
                setLoading(false);
                return;
            }

            const res = await importEmailsFromJson(validJsonInputs);
            
            if (!res.success) {
                setUiError(res.error);
            } else {
                setImportResult(res);
                setPreviewData([]); // Svuota l'anteprima
                setJsonInput("");   // Svuota l'input di testo
            }
        } catch (e: any) {
            setUiError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Conteggi dinamici per i contatori della UI
    const countDisponibili = previewData.filter(r => r.status === "disponibile").length;
    const countGiaPresenti = previewData.filter(r => r.status === "gia_presente").length;
    const countNonTrovati = previewData.filter(r => r.status === "non_trovato").length;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Importazione Email Cliniche</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Il sistema effettua un controllo a cascata trasparente. Se l'algoritmo esclude un match valido, puoi forzarlo manualmente usando il tasto dedicato prima di salvare.
                </p>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Area di testo per inserimento JSON */}
            <div className="flex flex-col space-y-2">
                <label className="font-medium text-sm text-gray-700 dark:text-gray-300">
                    Dati JSON in ingresso (Richiesto campo "indirizzo"):
                </label>
                <textarea
                    rows={6}
                    className="w-full p-3 font-mono text-xs border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 placeholder-gray-400"
                    placeholder={`[\n  {\n    "nome_clinica": "Studio Dentistico dr. Michele Caruso",\n    "google_maps_id": "ChIJ919t9uC2f0cRE9X4e0Oid38",\n    "indirizzo": "Via Roma 15, Treviso",\n    "email_ordinaria": "info@studiodentisticocaruso.it"\n  }\n]`}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    disabled={loading}
                />
            </div>

            {/* Pulsante di analisi */}
            <div className="flex justify-end">
                <button
                    onClick={handleVerify}
                    disabled={loading || !jsonInput.trim()}
                    className="px-5 py-2 bg-gray-800 text-white font-medium rounded-lg shadow text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                    {loading ? "Analisi e Calcolo Fuzzy in corso..." : "1. Analizza e Rileva Match"}
                </button>
            </div>

            {/* Alert Errori */}
            {uiError && (
                <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded text-sm font-medium">
                    ⚠️ {uiError}
                </div>
            )}

            {/* Alert Esito Scrittura */}
            {importResult && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded text-sm text-green-700 space-y-1 shadow-sm">
                    <p className="font-bold text-base">🎉 Scrittura a database completata con successo!</p>
                    <p>Aggiornati correttamente: <strong>{importResult.updated}</strong> record | Righe saltate/escluse: <strong>{importResult.skipped}</strong>.</p>
                </div>
            )}

            {/* BLOCCO ANTEPRIMA & TABELLA PARLANTE */}
            {previewData.length > 0 && (
                <div className="space-y-5 pt-4 border-t border-dashed border-gray-300">
                    
                    {/* Contatori macro */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-gray-100 border rounded-lg"><span className="block text-xl font-bold text-gray-800">{previewData.length}</span><span className="text-xs text-gray-500 font-medium">Totali nel JSON</span></div>
                        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg"><span className="block text-xl font-bold">{countDisponibili}</span><span className="text-xs text-green-600 font-medium">Da Importare (Nuove / Forzate)</span></div>
                        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg"><span className="block text-xl font-bold">{countGiaPresenti}</span><span className="text-xs text-yellow-600 font-medium">Già con Email a DB</span></div>
                        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg"><span className="block text-xl font-bold">{countNonTrovati}</span><span className="text-xs text-red-600 font-medium">Esclusi di Default</span></div>
                    </div>

                    {/* Tabella Dettagli Analisi */}
                    <div className="overflow-x-auto border rounded-lg shadow-sm bg-white dark:bg-gray-900">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 w-1/3">Struttura & Indirizzo (JSON)</th>
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 w-1/3">Miglior Match & Indirizzo (DB)</th>
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Esito Algoritmo</th>
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Stato / Azione</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                                        
                                        {/* COLONNA 1: DATI JSON */}
                                        <td className="p-3 space-y-0.5">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{row.nome_json}</p>
                                            <p className="text-[11px] text-gray-500 italic">📍 {row.indirizzo_json || "Nessun indirizzo nel JSON"}</p>
                                            <p className="text-[9px] text-gray-400 font-mono">{row.google_maps_id}</p>
                                        </td>
                                        
                                        {/* COLONNA 2: DATI DB CORRISPONDENTI */}
                                        <td className="p-3 space-y-0.5">
                                            {row.nome_db ? (
                                                <>
                                                    <p className="font-medium text-gray-800 dark:text-gray-200">{row.nome_db}</p>
                                                    <p className="text-[11px] text-gray-500 italic">🗄️ {row.indirizzo_db || "Indirizzo DB non valorizzato"}</p>
                                                </>
                                            ) : (
                                                <span className="italic text-red-400">Nessun record confrontato</span>
                                            )}
                                        </td>
                                        
                                        {/* COLONNA 3: BADGE SCORE */}
                                        <td className="p-3 whitespace-nowrap">
                                            {row.match_type === "id_link" && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 font-bold rounded text-[10px] tracking-wide uppercase">📍 ID Maps Esatto</span>
                                            )}
                                            {row.match_type === "fuzzy" && row.score >= 85 && (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 font-bold rounded text-[10px] tracking-wide uppercase">🤖 Fuzzy Valido ({row.score}%)</span>
                                            )}
                                            {row.match_type === "fuzzy" && row.score < 85 && (
                                                <span className="px-2 py-1 bg-red-100 text-red-600 font-bold rounded text-[10px] tracking-wide uppercase">⚠️ Insufficiente ({row.score}%)</span>
                                            )}
                                            {row.match_type === "nessuno" && <span className="text-gray-400 font-medium">—</span>}
                                        </td>
                                        
                                        {/* COLONNA 4: STATO ED EVENTUALE BOTTONE ACCETTAZIONE */}
                                        <td className="p-3">
                                            <div className="flex items-center space-x-2">
                                                {row.status === "disponibile" && (
                                                    <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-semibold text-[11px]">
                                                        Importabile
                                                    </span>
                                                )}
                                                {row.status === "gia_presente" && (
                                                    <span className="inline-flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-semibold text-[11px]" title={`Mail attuale a DB: ${row.email_db}`}>
                                                        Già a DB (Ignorato)
                                                    </span>
                                                )}
                                                {row.status === "non_trovato" && (
                                                    <>
                                                        <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-semibold text-[11px]">
                                                            Escluso
                                                        </span>
                                                        <button
                                                            onClick={() => handleForceAccept(idx)}
                                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] uppercase shadow-sm transition-colors"
                                                            title="Forza l'accettazione di questa riga anche se sotto la soglia fuzzy minima"
                                                        >
                                                            Accetta
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottone finale condizionale */}
                    {countDisponibili > 0 && (
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleConfirmImport}
                                disabled={loading}
                                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-all transform active:scale-95 flex items-center space-x-2"
                            >
                                {loading ? (
                                    <span>Scrittura in corso...</span>
                                ) : (
                                    <span>2. Conferma Scrittura Massiva ({countDisponibili} Email)</span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}