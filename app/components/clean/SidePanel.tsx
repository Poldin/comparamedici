"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bookmark, Globe, MapPin, Phone, Star, MessageSquare, Trash2, Plus, ExternalLink } from "lucide-react";

interface ReconciliationSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedRecord: any | null;
    onDeleteActivity: () => Promise<void>;
    onSaveGoogle: (id: string, data: any) => Promise<any>;
    onCreateDP: (googleId: string, dpData: any) => Promise<any>;
    onUpdateDP: (dpId: string, currentName: string, currentCategory: string) => Promise<any>;
    onRemoveLink: (linkId: string, googleId: string) => Promise<any>;
}

export function ReconciliationSheet({
    isOpen,
    onOpenChange,
    selectedRecord,
    onDeleteActivity,
    onSaveGoogle,
    onCreateDP,
    onUpdateDP,
    onRemoveLink,
}: ReconciliationSheetProps) {
    // Stato locale per gestire il record in tempo reale senza rinfrescare la pagina intera
    const [currentRecord, setCurrentRecord] = useState<any>(selectedRecord);

    // Stati Google Maps
    const [googleName, setGoogleName] = useState("");
    const [googleCategory, setGoogleCategory] = useState("");
    const [googlePhone, setGooglePhone] = useState("");
    const [googleWebsite, setGoogleWebsite] = useState("");
    const [googleBookingUrl, setGoogleBookingUrl] = useState("");
    const [googleAddress, setGoogleAddress] = useState("");
    const [googleAvgReview, setGoogleAvgReview] = useState("");
    const [googleTotalReviews, setGoogleTotalReviews] = useState("");

    // Stati per la creazione rapida del nuovo record MioDottore (DP) + Dati Analitici richiesti
    const [newDpName, setNewDpName] = useState("");
    const [newDpCategory, setNewDpCategory] = useState("");
    const [newDpTotalReviews, setNewDpTotalReviews] = useState("");
    const [newDpAvgGrade, setNewDpAvgGrade] = useState("");
    const [newDpLinkUrl, setNewDpLinkUrl] = useState("");
    const [isAddingNew, setIsAddingNew] = useState(false);

    useEffect(() => {
        if (selectedRecord) {
            setCurrentRecord(selectedRecord);
            setGoogleName(selectedRecord.name || "");
            setGoogleCategory(selectedRecord.google_category || "");
            setGooglePhone(selectedRecord.phone || "");
            setGoogleWebsite(selectedRecord.website_url || "");
            setGoogleBookingUrl(selectedRecord.online_booking_url || "");
            setGoogleAddress(selectedRecord.address || "");
            setGoogleAvgReview(selectedRecord.avg_review?.toString() || "");
            setGoogleTotalReviews(selectedRecord.total_reviews?.toString() || "");

            // Reset stati inserimento DP
            setNewDpName("");
            setNewDpCategory("");
            setNewDpTotalReviews("");
            setNewDpAvgGrade("");
            setNewDpLinkUrl("");
            setIsAddingNew(false);
        }
    }, [selectedRecord]);

    if (!currentRecord) return null;

    const handleGoogleSubmit = async () => {
        const updated = await onSaveGoogle(currentRecord.id, {
            name: googleName,
            google_category: googleCategory,
            phone: googlePhone,
            website_url: googleWebsite,
            online_booking_url: googleBookingUrl,
            address: googleAddress,
            avg_review: googleAvgReview ? parseFloat(googleAvgReview) : null,
            total_reviews: googleTotalReviews ? parseInt(googleTotalReviews, 10) : null,
        });
        if (updated) setCurrentRecord(updated);
    };

    const handleCreateDPSubmit = async () => {
        const recordName = newDpName.trim() || "";

        const fullDpData = {
            name: recordName,
            dp_category: newDpCategory || null,
            tot_dc_reviews: newDpTotalReviews ? parseInt(newDpTotalReviews, 10) : null,
            avg_grade: newDpAvgGrade ? parseFloat(newDpAvgGrade) : null,
            dp_link_url: newDpLinkUrl || null
        };

        // Invia i dati al DB e riceve il record aggiornato con le relazioni aggiornate
        const updatedRecord = await onCreateDP(currentRecord.id, fullDpData);
        if (updatedRecord) setCurrentRecord(updatedRecord);

        // Reset degli stati del form
        setNewDpName("");
        setNewDpCategory("");
        setNewDpTotalReviews("");
        setNewDpAvgGrade("");
        setNewDpLinkUrl("");
        setIsAddingNew(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full md:w-[50%] max-w-full md:max-w-[50%] overflow-y-auto space-y-6 bg-slate-50/50 p-6">

                <div className="space-y-6 pt-2">
                    {/* Box 1: Anagrafica Google Maps */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                        <div className="border-b pb-2">
                            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                <Bookmark className="w-4 h-4 text-blue-500" /> Anagrafica Google Maps
                            </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome Struttura</label>
                                <Input value={googleName} onChange={(e) => setGoogleName(e.target.value)} className="bg-slate-50/50 focus-visible:bg-white" />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Categoria Google</label>
                                <Input value={googleCategory} onChange={(e) => setGoogleCategory(e.target.value)} className="bg-slate-50/50 focus-visible:bg-white" />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Telefono</label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                    <Input value={googlePhone} onChange={(e) => setGooglePhone(e.target.value)} className="pl-9 bg-slate-50/50 focus-visible:bg-white" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Google ⭐ (Media Score)</label>
                                <div className="relative">
                                    <Star className="w-4 h-4 text-amber-500 absolute left-3 top-3 fill-amber-500" />
                                    <Input type="number" step="0.1" min="1" max="5" value={googleAvgReview} onChange={(e) => setGoogleAvgReview(e.target.value)} className="pl-9 bg-slate-50/50 focus-visible:bg-white" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Numero Recensioni</label>
                                <div className="relative">
                                    <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                    <Input type="number" value={googleTotalReviews} onChange={(e) => setGoogleTotalReviews(e.target.value)} className="pl-9 bg-slate-50/50 focus-visible:bg-white" />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Indirizzo</label>
                                <div className="relative">
                                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                    <Input value={googleAddress} onChange={(e) => setGoogleAddress(e.target.value)} className="pl-9 bg-slate-50/50 focus-visible:bg-white" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Sito Web (URL)</label>
                                <div className="relative">
                                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                    <Input value={googleWebsite} onChange={(e) => setGoogleWebsite(e.target.value)} className="pl-9 bg-slate-50/50 focus-visible:bg-white" placeholder="https://..." />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Prenotazione Online</label>
                                <Input value={googleBookingUrl} onChange={(e) => setGoogleBookingUrl(e.target.value)} className="bg-slate-50/50 focus-visible:bg-white" placeholder="https://www.miodottore.it/..." />
                            </div>
                        </div>

                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 mt-2 shadow-xs" onClick={handleGoogleSubmit}>
                            Aggiorna Google
                        </Button>
                    </div>

                    {/* Box Unico: MioDottore */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> MioDottore
                            </h4>
                            {!isAddingNew && (
                                <Button size="sm" variant="outline" className="text-xs h-7 gap-1 border-emerald-200 hover:bg-emerald-50 text-emerald-700" onClick={() => setIsAddingNew(true)}>
                                    <Plus className="w-3.5 h-3.5" /> Associa Nuovo
                                </Button>
                            )}
                        </div>

                        {/* Lista dei Record Collegati legata allo stato locale */}
                        <div className="space-y-3">
                            {currentRecord.comparator_link_g_dp && currentRecord.comparator_link_g_dp.length > 0 ? (
                                currentRecord.comparator_link_g_dp.map((link: any) => {
                                    const dp = link.comparator_out_dp;
                                    return (
                                        <div key={link.id} className="p-4 border rounded-xl bg-slate-50/50 border-slate-200 hover:border-emerald-200 transition-all space-y-3 relative group">
                                            <div className="flex justify-between items-start pr-8">
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900 cursor-pointer hover:underline"
                                                        onClick={async () => {
                                                            const updated = await onUpdateDP(link.dp_id, dp?.name, dp?.dp_category);
                                                            if (updated) setCurrentRecord(updated);
                                                        }}
                                                    >
                                                        {dp?.name || "Nessun nome"}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Cat: {dp?.dp_category || "N/A"}</p>
                                                </div>

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 absolute right-3 top-3 transition-colors"
                                                    onClick={async () => {
                                                        // Passiamo l'id del link E l'id del record google corrente
                                                        const updatedRecord = await onRemoveLink(link.id, currentRecord.id);
                                                        if (updatedRecord) setCurrentRecord(updatedRecord);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border text-center text-xs">
                                                <div className="space-y-0.5 border-r">
                                                    <span className="text-[10px] text-slate-400 font-medium block uppercase">Punteggio</span>
                                                    <span className="font-semibold text-slate-700 flex items-center justify-center gap-0.5">
                                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {dp?.avg_grade ?? "-"}
                                                    </span>
                                                </div>
                                                <div className="space-y-0.5 border-r">
                                                    <span className="text-[10px] text-slate-400 font-medium block uppercase">Recensioni</span>
                                                    <span className="font-semibold text-slate-700">{dp?.tot_dc_reviews ?? 0}</span>
                                                </div>
                                                <div className="space-y-0.5 flex flex-col justify-center items-center">
                                                    <span className="text-[10px] text-slate-400 font-medium block uppercase">Link DP</span>
                                                    {dp?.dp_link_url ? (
                                                        <a href={dp.dp_link_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-0.5 font-medium underline">
                                                            Vedi <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                !isAddingNew && (
                                    <p className="text-xs text-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500">
                                        Nessun record MioDottore collegato a questa attività.
                                    </p>
                                )
                            )}
                        </div>

                        {/* Inserimento rapido allineato */}
                        {isAddingNew && (
                            <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Nuovo Collegamento MioDottore</span>
                                    <button className="text-xs text-slate-400 hover:text-slate-600 underline" onClick={() => setIsAddingNew(false)}>
                                        Annulla
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600 mb-0.5 block">Media Voto (Real)</label>
                                        <Input type="number" step="0.1" min="1" max="5" value={newDpAvgGrade} onChange={(e) => setNewDpAvgGrade(e.target.value)} placeholder="4.8" className="bg-white h-9" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-600 mb-0.5 block">Tot. Recensioni (Integer)</label>
                                        <Input type="number" value={newDpTotalReviews} onChange={(e) => setNewDpTotalReviews(e.target.value)} placeholder="24" className="bg-white h-9" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-semibold text-slate-600 mb-0.5 block">Link MioDottore (URL)</label>
                                        <Input value={newDpLinkUrl} onChange={(e) => setNewDpLinkUrl(e.target.value)} placeholder="https://www.miodottore.it/nome-medico" className="bg-white h-9" />
                                    </div>
                                </div>

                                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-xs mt-2" onClick={handleCreateDPSubmit}>
                                    Crea e Associa
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}