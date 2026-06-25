'use client';

import React, { useState, useEffect } from 'react';
import { checkExistingPlaceIds } from './actions';

interface StudioDentistico {
    id: string;
    nome: string;
    categoria: string;
    telefono: string;
    sitoWeb: string;
    indirizzo: string;
    rating: string;
    recensioni: string;
    coordinate: { lat: string; lng: string };
    haPrenotazione: boolean;
    linkPrenotazione: string;
    mapsUrl: string;
    googlePlaceId: string;
}

interface MappingConfig {
    itemSelector: string;
    nomeSelector: string;
    categoriaSelector: string;
    telefonoSelector: string;
    sitoSelector: string;
    indirizzoSelector: string;
    ratingSelector: string;
    recensioniSelector: string;
    prenotazioneSelector: string;
}

export default function MappeScraperPage() {
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [existingPlaceIds, setExistingPlaceIds] = useState<string[]>([]);
    const [isValidating, setIsValidating] = useState(false);

    const [config, setConfig] = useState<MappingConfig>({
        itemSelector: 'div[role="article"]',
        nomeSelector: '.qBF1Pd',
        categoriaSelector: '.W4Efsd',
        telefonoSelector: '.UsdlK',
        sitoSelector: 'a[data-value="Sito web"]',
        indirizzoSelector: '.W4Efsd',
        ratingSelector: '.MW4etd',
        recensioniSelector: '.UY7F9',
        prenotazioneSelector: '.A1zNzb',
    });

    const [records, setRecords] = useState<StudioDentistico[]>([]);

    const handleHtmlParsing = async (parsedRecords: StudioDentistico[]) => {
        if (parsedRecords.length === 0) {
            setExistingPlaceIds([]);
            return;
        }

        setIsValidating(true);
        try {
            // 1. Estrai tutti i googlePlaceId dai record appena parsati (occhio al camelCase dell'interfaccia!)
            const parsedPlaceIds = parsedRecords.map(r => r.googlePlaceId).filter(id => id && id !== 'N/D');

            // 2. Interroga il database tramite la Server Action
            const duplicates = await checkExistingPlaceIds(parsedPlaceIds);

            // 3. Salva i duplicati nello stato
            setExistingPlaceIds(duplicates);
        } catch (error) {
            console.error("Errore durante il controllo dei duplicati:", error);
        } finally {
            setIsValidating(false);
        }
    };

    // Funzione per rigenerare la tabella al volo
    const elaboraDati = () => {
        if (!htmlContent.trim()) {
            setRecords([]);
            return;
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const items = doc.querySelectorAll(config.itemSelector);
            const parsedData: StudioDentistico[] = [];

            items.forEach((item, index) => {
                // 1. Estrazione Nome
                const nomeEl = item.querySelector(config.nomeSelector);
                const nome = nomeEl?.textContent?.trim() || item.getAttribute('aria-label') || `Studio Sconosciuto #${index + 1}`;

                // 2. Estrazione Info di Contatto e Recensioni
                const telefono = item.querySelector(config.telefonoSelector)?.textContent?.trim() || 'N/D';
                const sitoEl = item.querySelector(config.sitoSelector);
                const sitoWeb = sitoEl?.getAttribute('href') || 'N/D';
                const ratingRaw = item.querySelector(config.ratingSelector)?.textContent?.trim() || 'N/D';
                // Sostituisce la virgola italiana con il punto decimale (es. "4,7" -> "4.7")
                const rating = ratingRaw !== 'N/D' ? ratingRaw.replace(',', '.') : 'N/D';
                const recensioniRaw = item.querySelector(config.recensioniSelector)?.textContent?.trim() || '';
                const recensioni = recensioniRaw.replace(/[()]/g, '') || '0';

                // 3. Estrazione URL Principale di Maps e Coordinate
                const linkEl = item.querySelector('a.hfpxzc');
                const mapsUrl = linkEl?.getAttribute('href') || '';

                let lat = 'N/D';
                let lng = 'N/D';
                let googlePlaceId = 'N/D';


                if (mapsUrl) {
                    const latMatch = mapsUrl.match(/!3d([-?0-9.]+)/);
                    const lngMatch = mapsUrl.match(/!4d([-?0-9.]+)/);
                    const idMatch = mapsUrl.match(/1s(0x[a-f0-9]+)/);

                    if (latMatch) lat = latMatch[1];
                    if (lngMatch) lng = lngMatch[1];
                    if (idMatch) googlePlaceId = idMatch[1];
                }

                // 4. STRATEGIA PER CATEGORIA E INDIRIZZO (Normalizzata in minuscolo)
                let categoria = 'N/D';
                let indirizzo = 'N/D';

                const blocchiTesto = item.querySelectorAll(config.indirizzoSelector); // Selettore '.W4Efsd'

                blocchiTesto.forEach(blocco => {
                    const testoOriginale = blocco.textContent || '';
                    const testoMinuscolo = testoOriginale.toLowerCase();

                    if (
                        testoMinuscolo.includes('via') ||
                        testoMinuscolo.includes('piazza') ||
                        testoMinuscolo.includes('piazzetta') ||
                        testoMinuscolo.includes('p.za') ||
                        testoMinuscolo.includes('p.tta') ||
                        testoMinuscolo.includes('corso') ||
                        testoMinuscolo.includes('viale') ||
                        testoMinuscolo.includes('largo')
                    ) {
                        const parti = testoOriginale.split('·');

                        if (parti[0]) {
                            categoria = parti[0].trim();
                        }

                        const pezzoIndirizzo = parti.find(p => {
                            const pMin = p.toLowerCase();
                            return pMin.includes('via') || pMin.includes('piazza') || pMin.includes('piazzetta') ||
                                pMin.includes('p.za') || pMin.includes('p.tta') || pMin.includes('corso') ||
                                pMin.includes('viale') || pMin.includes('largo');
                        });

                        if (pezzoIndirizzo) {
                            indirizzo = pezzoIndirizzo.trim();
                        }
                    }
                });

                // 5. Estrazione Link Prenotazione
                const prenotazioneEl = item.querySelector(config.prenotazioneSelector);
                let linkPrenotazione = 'N/D';
                let haPrenotazione = false;

                if (prenotazioneEl) {
                    const href = prenotazioneEl.getAttribute('href');
                    if (href && prenotazioneEl.textContent?.toLowerCase().includes('prenota')) {
                        linkPrenotazione = href;
                        haPrenotazione = true;
                    }
                }

                // 6. Push finale nell'array dei record
                parsedData.push({
                    id: `studio-row-${index}`,
                    nome,
                    categoria,
                    telefono,
                    sitoWeb,
                    indirizzo,
                    rating,
                    recensioni,
                    coordinate: { lat, lng },
                    haPrenotazione,
                    linkPrenotazione,
                    mapsUrl: mapsUrl || 'N/D',
                    googlePlaceId
                });
            });

            setRecords(parsedData);
            handleHtmlParsing(parsedData);
        } catch (error) {
            console.error("Errore di mapping:", error);
        }
    };

    // Esegui comunque l'elaborazione quando cambia l'html o la configurazione
    useEffect(() => {
        elaboraDati();
    }, [htmlContent, config]);

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
            <div className="mx-auto space-y-6">

                <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">🗺️ Compara Medici - inserisci dati</h1>
                        <p className="text-sm text-gray-500 mt-1">Estrazione dati rigida e dinamica da Google Maps</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold border border-blue-100">
                            Record Rilevati: <span className="text-xl font-bold">{records.length}</span>
                        </div>
                        {existingPlaceIds.length > 0 && (
                            <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg font-semibold border border-amber-100">
                                Già in DB: <span className="text-xl font-bold">{isValidating ? '...' : existingPlaceIds.length}</span>
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Incolla l'HTML di Google Maps qui:</label>
                        <textarea
                            className="w-full flex-1 min-h-[350px] p-3 text-xs font-mono bg-gray-900 text-green-400 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Incolla l'HTML..."
                            value={htmlContent}
                            onChange={(e) => setHtmlContent(e.target.value)}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">⚙️ Configurazione Selettori</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Selettore Blocco (Articolo)</label>
                                <input type="text" className="w-full p-2 border rounded bg-gray-50 font-mono text-xs" value={config.itemSelector} onChange={(e) => setConfig({ ...config, itemSelector: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Selettore Nome</label>
                                <input type="text" className="w-full p-2 border rounded bg-gray-50 font-mono text-xs" value={config.nomeSelector} onChange={(e) => setConfig({ ...config, nomeSelector: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Selettore Categoria</label>
                                <input type="text" className="w-full p-2 border rounded bg-gray-50 font-mono text-xs" value={config.categoriaSelector} onChange={(e) => setConfig({ ...config, categoriaSelector: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Selettore Telefono</label>
                                <input type="text" className="w-full p-2 border rounded bg-gray-50 font-mono text-xs" value={config.telefonoSelector} onChange={(e) => setConfig({ ...config, telefonoSelector: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Selettore Indirizzo</label>
                                <input type="text" className="w-full p-2 border rounded bg-gray-50 font-mono text-xs" value={config.indirizzoSelector} onChange={(e) => setConfig({ ...config, indirizzoSelector: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Selettore Sito Web</label>
                                <input type="text" className="w-full p-2 border rounded bg-gray-50 font-mono text-xs" value={config.sitoSelector} onChange={(e) => setConfig({ ...config, sitoSelector: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Selettore Prenotazione</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded bg-gray-50 font-mono text-xs"
                                    value={config.prenotazioneSelector}
                                    onChange={(e) => setConfig({ ...config, prenotazioneSelector: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Selettore Stelle</label>
                                <input type="text" className="w-full p-2 border rounded bg-gray-50 font-mono text-xs" value={config.ratingSelector} onChange={(e) => setConfig({ ...config, ratingSelector: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Selettore Recensioni</label>
                                <input type="text" className="w-full p-2 border rounded bg-gray-50 font-mono text-xs" value={config.recensioniSelector} onChange={(e) => setConfig({ ...config, recensioniSelector: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>

                {records.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Tabella Risultati</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={elaboraDati}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-1.5 rounded-lg text-sm transition flex items-center gap-1"
                                >
                                    🔄 Ricalcola
                                </button>

                                <button
                                    onClick={async () => {
                                        if (records.length === 0) return;
                                        setIsSaving(true);
                                        try {
                                            const res = await fetch('/api/studios/upsert', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ records })
                                            });
                                            const data = await res.json();

                                            if (res.ok) {
                                                alert(`🎉 Salvataggio completato! ${data.message}`);
                                            } else {
                                                alert(`❌ Errore: ${data.error || 'Impossibile salvare i dati.'}`);
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            alert('❌ Errore di rete durante il salvataggio.');
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    className={`${isSaving ? 'bg-zinc-400 cursor-not-allowed' : 'bg-zinc-600 hover:bg-zinc-700'
                                        } text-white font-semibold px-5 py-1.5 rounded-lg text-sm transition flex items-center gap-1 shadow-sm`}
                                >
                                    {isSaving ? (
                                        <>⌛ Salvataggio in corso...</>
                                    ) : (
                                        <>📥 Salva / Aggiorna nel DB</>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-100 text-xs text-gray-700 uppercase font-semibold">
                                    <tr>
                                        <th className="p-3">Nome</th>
                                        <th className="p-3">Google Place ID</th>
                                        <th className="p-3">G Categoria</th>
                                        <th className="p-3 text-center">G maps</th>
                                        <th className="p-3">Telefono</th>
                                        <th className="p-3">Sito</th>
                                        <th className="p-3 text-center">Prenotazione Online</th>
                                        <th className="p-3">Indirizzo</th>
                                        <th className="p-3 text-center">Google ⭐⭐</th>
                                        <th className="p-3 text-center"># Recensioni</th>
                                        <th className="p-3">Coordinate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {records.map((studio) => {
                                        const conteggioId = studio.googlePlaceId !== 'N/D'
                                            ? records.filter(r => r.googlePlaceId === studio.googlePlaceId).length
                                            : 1;
                                        const eDuplicato = conteggioId > 1;
                                        const giaInDatabase = existingPlaceIds.includes(studio.googlePlaceId);

                                        return (
                                            <tr
                                                key={studio.id}
                                                className={`hover:bg-gray-50 transition-colors ${giaInDatabase ? 'bg-amber-50/70 hover:bg-amber-100/50' : ''
                                                    }`}
                                            >
                                                {/* === FIXATO: Il div ora è correttamente avvolto dal tag td === */}
                                                <td className="p-3 font-semibold text-gray-900 max-w-[200px]">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span>{studio.nome}</span>
                                                        {giaInDatabase && (
                                                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded w-max mt-1">
                                                                💾 GIÀ NEL DATABASE
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={`p-3 font-mono text-xs transition-colors ${eDuplicato ? 'bg-red-50 text-red-700' : 'text-gray-600'}`}>
                                                    <div className="flex flex-col gap-1">
                                                        <span>{studio.googlePlaceId}</span>
                                                        {eDuplicato && (
                                                            <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-bold w-max">
                                                                ⚠️ DUPLICATO ({conteggioId} volte)
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded border border-gray-200">
                                                        {studio.categoria}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {studio.mapsUrl !== 'N/D' ? (
                                                        <a
                                                            href={studio.mapsUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-red-500 hover:text-red-700 transition text-lg"
                                                            title="Apri in Google Maps"
                                                        >
                                                            📍
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">N/D</span>
                                                    )}
                                                </td>
                                                <td className="p-3 font-mono text-xs text-blue-600">{studio.telefono}</td>
                                                <td className="p-3 max-w-[180px] truncate">
                                                    {studio.sitoWeb !== 'N/D' ? (
                                                        <a href={studio.sitoWeb} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">{studio.sitoWeb}</a>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">N/D</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {studio.haPrenotazione ? (
                                                        <a
                                                            href={studio.linkPrenotazione}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-green-200 transition"
                                                        >
                                                            📅 Sì (Vedi Link)
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">❌ No</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-xs max-w-[200px] truncate">{studio.indirizzo}</td>
                                                <td className="p-3 text-center font-bold text-yellow-600">{studio.rating} ⭐</td>
                                                <td className="p-3 text-center font-medium">{studio.recensioni}</td>
                                                <td className="p-3 text-xs font-mono text-gray-500">
                                                    {studio.coordinate.lat}, {studio.coordinate.lng}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}