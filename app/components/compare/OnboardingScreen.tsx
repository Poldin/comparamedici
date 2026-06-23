"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { searchActivitiesByName, getRandomActivities } from "./actions";

interface Activity {
    id: string;
    name: string;
    google_category: string | null;
    avg_review: number | null;
    total_reviews: number | null;
    lat: number | null;
    lng: number | null;
    address: string | null;
    phone: string | null;
}

export default function Onboarding() {
    const router = useRouter();
    const [keyword, setKeyword] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<Activity[]>([]);

    // Stato che contiene le attività random estratte dal DB all'avvio
    const [featured, setFeatured] = useState<Activity[]>([]);
    // Stato di caricamento per le soluzioni one-click
    const [loadingFeatured, setLoadingFeatured] = useState(true);

    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Carica le attività random all'avvio del componente
    useEffect(() => {
        async function loadFeatured() {
            setLoadingFeatured(true);
            const { data, error } = await getRandomActivities();
            if (!error && data) {
                setFeatured(data);
            }
            setLoadingFeatured(false);
        }
        loadFeatured();
    }, []);

    // Chiude la tendina se l'utente clicca fuori dal componente
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Effetto di Autocomplete in tempo reale con Debounce
    useEffect(() => {
        if (keyword.trim().length < 2) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setSearching(true);
            const { data, error } = await searchActivitiesByName(keyword);
            if (!error && data) {
                setResults(data);
                setShowDropdown(true);
            }
            setSearching(false);
        }, 100);

        return () => clearTimeout(delayDebounceFn);
    }, [keyword]);

    const handleSelectActivity = (activity: any) => {
        if (activity.lat === null || activity.lng === null) {
            alert("Questa attività non ha coordinate geografiche valide nel database.");
            return;
        }
        setShowDropdown(false);
        setKeyword(activity.name);

        // Generiamo uno slug/id pulito partendo dal nome (es: "Studio Marazzato" -> "studio-marazzato")
        const clinicSlug = activity.id || encodeURIComponent(activity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

        // Reindirizziamo verso il nuovo path dinamico
        router.push(`/clinic/${clinicSlug}?lat=${activity.lat}&lng=${activity.lng}&radius=15&name=${encodeURIComponent(activity.name)}`);
    };

    const hasSearchKeyword = keyword.trim().length >= 2;
    const dropdownItems = hasSearchKeyword ? results : featured;

    return (
        <div className="w-full max-w-md mx-auto space-y-10 text-zinc-800" ref={dropdownRef}>
            {/* Testata */}
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter uppercase">
                    Compara medici
                </h1>
                <p className="text-sm text-neutral-500 leading-relaxed">
                    Compara le attività mediche sul territorio. Verifica il livello di reputazione di poliambulatori, studi, cliniche e centri medici.
                </p>
            </div>

            {/* Sezione Input e Pulsanti Rapidi */}
            <div className="space-y-4">
                <div className="space-y-2 relative">
                    <div className="relative flex gap-2">
                        <Input
                            type="text"
                            placeholder="Cerca una clinica o studio medico..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onFocus={() => setShowDropdown(true)}
                            className="h-12 rounded-lg border border-neutral-300 focus-visible:ring-zinc-300 focus-visible:border-zinc-300 text-sm bg-white"
                        />
                        {searching && (
                            <div className="absolute right-3 top-3.5 text-xs text-neutral-400 font-mono animate-pulse uppercase font-bold">
                                ...
                            </div>
                        )}
                    </div>

                    {/* TENDINA UNIFICATA (Risultati o Suggerimenti) */}
                    {showDropdown && dropdownItems.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-neutral-100">


                            {dropdownItems.map((activity) => (
                                <button
                                    key={activity.id}
                                    type="button"
                                    onClick={() => handleSelectActivity(activity)}
                                    className="w-full text-left p-3 hover:bg-zinc-50 transition-colors flex justify-between items-center group"
                                >
                                    <div className="truncate pr-2">
                                        <div className="font-bold text-xs text-zinc-900 group-hover:text-black truncate uppercase tracking-tight">
                                            {activity.name}
                                        </div>
                                        <div className="text-[10px] font-mono text-neutral-400 font-bold uppercase mt-0.5 truncate">
                                            {(() => {
                                                const metadata = [
                                                    activity.google_category,
                                                    activity.address, // Assicurati che le tue Server Actions (searchActivitiesByName) restituiscano address e phone se vuoi vederli qui
                                                    activity.phone
                                                ].filter(Boolean);

                                                return metadata.length > 0 ? metadata.join(" · ") : "Generico";
                                            })()}
                                        </div>
                                    </div>
                                    {activity.total_reviews ? (
                                        <div className="shrink-0 text-[10px] font-mono text-neutral-400 font-medium whitespace-nowrap">
                                            {activity.total_reviews} rec.
                                        </div>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Stato: Nessun risultato trovato */}
                    {showDropdown && hasSearchKeyword && results.length === 0 && !searching && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 text-center z-50 text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                            Nessun brand trovato nel DB
                        </div>
                    )}
                </div>

                {/* SKELETON O TASTI CLICK VELOCI SOTTO IL CAMPO INPUT */}
                {loadingFeatured ? (
                    <div className="space-y-2 pt-1 animate-pulse">
                        <div className="h-3 w-14 bg-neutral-200 rounded" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[...Array(4)].map((_, index) => (
                                <div
                                    key={`skeleton-${index}`}
                                    className="bg-neutral-100 border border-neutral-200 px-4 py-3 rounded-lg h-[68px] flex flex-col justify-center space-y-2"
                                >
                                    <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
                                    <div className="h-2.5 bg-neutral-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : featured.length > 0 ? (
                    <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider block">
                            Oppure
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {featured.map((activity) => (
                                <button
                                    key={`btn-${activity.id}`}
                                    type="button"
                                    onClick={() => handleSelectActivity(activity)}
                                    className="flex flex-col text-left justify-center bg-neutral-100 hover:bg-zinc-200 text-zinc-700 px-4 py-3 rounded-lg transition-colors border border-neutral-200 w-full h-auto shadow-sm group"
                                >
                                    {/* Nome principale */}
                                    <span className="text-xs font-bold uppercase tracking-tight text-zinc-900 group-hover:text-black whitespace-normal wrap-break-word">
                                        {activity.name}
                                    </span>

                                    {/* metadati */}
                                    {(() => {
                                        const metadata = [
                                            activity.google_category,
                                            activity.address, // Assicurati che anche getRandomActivities restituisca address e phone nel SELECT
                                            activity.phone
                                        ].filter(Boolean);

                                        return metadata.length > 0 ? (
                                            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase mt-1 whitespace-normal wrap-break-word">
                                                {metadata.join(" · ")}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-mono font-bold text-neutral-300 uppercase mt-1">
                                                Generico
                                            </span>
                                        );
                                    })()}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}