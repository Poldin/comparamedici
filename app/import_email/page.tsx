"use client";

import { useState } from "react";
import { checkEmailsBeforeImport, importEmailsFromJson, CheckedRecord, ImportResult } from "./actions";

export default function ImportEmailPage() {
    const [jsonInput, setJsonInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<CheckedRecord[]>([]);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [uiError, setUiError] = useState<string | null>(null);

    // Esegue solo il controllo preliminare
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

    // Esegue l'importazione vera e propria basandosi sul JSON attualmente verificato
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
                setJsonInput("");   // Svuota l'input
            }
        } catch (e: any) {
            setUiError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Calcolo dei contatori veloci per i badge di riepilogo dell'anteprima
    const countDisponibili = previewData.filter(r => r.status === "disponibile").length;
    const countGiaPresenti = previewData.filter(r => r.status === "gia_presente").length;
    const countNonTrovati = previewData.filter(r => r.status === "non_trovato").length;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Importazione Email Cliniche</h1>
                <p className="text-sm text-gray-500 mt-1">Passo 1: Verifica i match con il Database. Passo 2: Conferma l'inserimento.</p>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Area di Input JSON */}
            <div className="flex flex-col space-y-2">
                <label className="font-medium text-sm text-gray-700 dark:text-gray-300">Incolla qui il codice JSON:</label>
                <textarea
                    rows={6}
                    className="w-full p-3 font-mono text-xs border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                    placeholder="[ { ... } ]"
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    disabled={loading}
                />
            </div>

            {/* Pulsante di sola verifica */}
            <div className="flex justify-end">
                <button
                    onClick={handleVerify}
                    disabled={loading || !jsonInput.trim()}
                    className="px-5 py-2 bg-gray-800 text-white font-medium rounded-lg shadow text-sm hover:bg-gray-700 disabled:opacity-50"
                >
                    {loading ? "Analisi..." : "1. Analizza e Rileva Match"}
                </button>
            </div>

            {uiError && (
                <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded text-sm">{uiError}</div>
            )}

            {/* Esito Finale dell'Importazione */}
            {importResult && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded text-sm text-green-700 space-y-1">
                    <p className="font-bold text-base">🎉 Scrittura completata con successo!</p>
                    <p>Fatti: <strong>{importResult.updated}</strong> email inserite | Saltati: <strong>{importResult.skipped}</strong> record.</p>
                </div>
            )}

            {/* BLOCCO ANTEPRIMA ED ELENCO RILEVAZIONI */}
            {previewData.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-dashed border-gray-300">
                    
                    {/* Badge di riepilogo immediato */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-gray-100 rounded-lg"><span className="block text-xl font-bold">{previewData.length}</span><span className="text-xs text-gray-500">Totali nel JSON</span></div>
                        <div className="p-3 bg-green-100 text-green-800 rounded-lg"><span className="block text-xl font-bold">{countDisponibili}</span><span className="text-xs text-green-600">Da Importare (Nuove)</span></div>
                        <div className="p-3 bg-yellow-100 text-yellow-800 rounded-lg"><span className="block text-xl font-bold">{countGiaPresenti}</span><span className="text-xs text-yellow-600">Già con email a DB</span></div>
                        <div className="p-3 bg-red-100 text-red-800 rounded-lg"><span className="block text-xl font-bold">{countNonTrovati}</span><span className="text-xs text-red-600">ID non trovato a DB</span></div>
                    </div>

                    {/* Tabella dettagliata */}
                    <div className="overflow-x-auto border rounded-lg shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-3 font-semibold text-gray-700">Clinica (JSON)</th>
                                    <th className="p-3 font-semibold text-gray-700">Match DB</th>
                                    <th className="p-3 font-semibold text-gray-700">Email JSON</th>
                                    <th className="p-3 font-semibold text-gray-700">Stato</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-900">{row.nome_json}</td>
                                        <td className="p-3 text-gray-500">{row.nome_db || <span className="italic text-red-400">Nessun match</span>}</td>
                                        <td className="p-3 font-mono">{row.email_json}</td>
                                        <td className="p-3">
                                            {row.status === "disponibile" && <span className="px-2 py-1 bg-green-100 text-green-800 font-medium rounded">Importabile</span>}
                                            {row.status === "gia_presente" && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 font-medium rounded">Già a DB ({row.email_db})</span>}
                                            {row.status === "non_trovato" && <span className="px-2 py-1 bg-red-100 text-red-800 font-medium rounded">ID assente</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottone di conferma finale se ci sono record scrivibili */}
                    {countDisponibili > 0 && (
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleConfirmImport}
                                disabled={loading}
                                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors"
                            >
                                {loading ? "Salvataggio..." : `2. Conferma Scrittura (${countDisponibili} Email)`}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}