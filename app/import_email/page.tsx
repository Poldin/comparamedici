"use client";

import { useState } from "react";
import { checkEmailsBeforeImport, importEmailsFromJson, CheckedRecord, ImportResult } from "./actions";

export default function ImportEmailPage() {
    const [jsonInput, setJsonInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<CheckedRecord[]>([]);
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
                setPreviewData(res.data);
            }
        } catch (e: any) {
            setUiError(`JSON non valido: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // FASE 2: Conferma scrittura
    const handleConfirmImport = async () => {
        setLoading(true);
        setUiError(null);

        try {
            const parsedJson = JSON.parse(jsonInput);
            const res = await importEmailsFromJson(parsedJson);
            
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
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Importazione Email Cliniche</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Il sistema effettua un controllo a cascata trasparente: cerca il Place ID nel link di Google e, in caso di fallimento, analizza la similitudine Fuzzy (Nome + Indirizzo) mostrandoti sempre il punteggio ottenuto.
                </p>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Area di testo per inserimento JSON */}
            <div className="flex flex-col space-y-2">
                <label className="font-medium text-sm text-gray-700 dark:text-gray-300">
                    Dati JSON in ingresso (Richiesto campo "indirizzo"):
                </label>
                <textarea
                    rows={8}
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
                    <p>Aggiornati correttamente: <strong>{importResult.updated}</strong> record | Righe saltate (escluse o già con email): <strong>{importResult.skipped}</strong>.</p>
                </div>
            )}

            {/* BLOCCO ANTEPRIMA & TABELLA PARLANTE */}
            {previewData.length > 0 && (
                <div className="space-y-5 pt-4 border-t border-dashed border-gray-300 animate-fadeIn">
                    
                    {/* Contatori macro */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-gray-100 border rounded-lg"><span className="block text-xl font-bold text-gray-800">{previewData.length}</span><span className="text-xs text-gray-500 font-medium">Totali nel JSON</span></div>
                        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg"><span className="block text-xl font-bold">{countDisponibili}</span><span className="text-xs text-green-600 font-medium">Da Importare (Nuove)</span></div>
                        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg"><span className="block text-xl font-bold">{countGiaPresenti}</span><span className="text-xs text-yellow-600 font-medium">Già con Email a DB</span></div>
                        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg"><span className="block text-xl font-bold">{countNonTrovati}</span><span className="text-xs text-red-600 font-medium">Esclusi (Sotto Soglia)</span></div>
                    </div>

                    {/* Tabella Dettagli Analisi */}
                    <div className="overflow-x-auto border rounded-lg shadow-sm bg-white dark:bg-gray-900">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Struttura (JSON)</th>
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Miglior Match DB Calcolato</th>
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Esito Analisi Algoritmo</th>
                                    <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Azione DB</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-3">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{row.nome_json}</p>
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{row.google_maps_id}</p>
                                        </td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">
                                            {row.nome_db ? (
                                                <span className="font-medium">{row.nome_db}</span>
                                            ) : (
                                                <span className="italic text-red-400">Nessuna attività valutabile</span>
                                            )}
                                        </td>
                                        <td className="p-3 whitespace-nowrap">
                                            {row.match_type === "id_link" && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 font-bold rounded text-[10px] tracking-wide uppercase">📍 ID Maps Esatto</span>
                                            )}
                                            {row.match_type === "fuzzy" && row.score >= 85 && (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 font-bold rounded text-[10px] tracking-wide uppercase">🤖 Fuzzy Valido ({row.score}%)</span>
                                            )}
                                            {row.match_type === "fuzzy" && row.score < 85 && (
                                                <span className="px-2 py-1 bg-red-100 text-red-600 font-bold rounded text-[10px] tracking-wide uppercase">⚠️ Fuzzy Insufficiente ({row.score}%)</span>
                                            )}
                                            {row.match_type === "nessuno" && <span className="text-gray-400 font-medium">—</span>}
                                        </td>
                                        <td className="p-3 font-medium">
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
                                                <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-semibold text-[11px]">
                                                    Escluso
                                                </span>
                                            )}
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