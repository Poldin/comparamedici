"use client";

import { useState, useEffect, useTransition } from "react";
import {
    getGoogleRecords,
    updateGoogleRecord,
    createAndLinkDPRecord,
    updateDPRecord,
    deleteLink,
    getUniqueGoogleCategories,
    deleteGoogleRecords
} from "./actions";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryFilter } from "../components/clean/CategoryFilter";
import { TablePagination } from "../components/clean/TablePagination";
import { ReconciliationSheet } from "../components/clean/SidePanel";

const PAGE_SIZE = 100; // Quanti record mostrare per pagina

export default function CleanPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Stati per la Paginazione
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [googleName, setGoogleName] = useState("");
    const [googlePhone, setGooglePhone] = useState("");
    const [googleBookingUrl, setGoogleBookingUrl] = useState("");
    const [newDpName, setNewDpName] = useState("");
    const [newDpCategory, setNewDpCategory] = useState("");

    useEffect(() => {
        getUniqueGoogleCategories().then(setCategories);
    }, []);

    // Se l'utente digita una ricerca o cambia categoria, lo resettiamo a pagina 1
    useEffect(() => {
        setPage(1);
    }, [search, selectedCategories]);

    // Caricamento dati reattivo a filtri E pagina corrente
    useEffect(() => {
        startTransition(async () => {
            const response = await getGoogleRecords(search, selectedCategories, page, PAGE_SIZE);
            setRecords(response.data);
            setTotalCount(response.count);

            if (selectedRecord) {
                const updated = response.data.find((r) => r.id === selectedRecord.id);
                if (updated) setSelectedRecord(updated);
            }
        });
    }, [search, selectedCategories, page]); // <-- Monitora la pagina per aggiornare i dati

    useEffect(() => {
        if (selectedRecord) {
            setGoogleName(selectedRecord.name || "");
            setGooglePhone(selectedRecord.phone || "");
            setGoogleBookingUrl(selectedRecord.online_booking_url || "");
            setNewDpName("");
            setNewDpCategory("");
        }
    }, [selectedRecord]);

    const handleSelectRow = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedRowIds((prev) => [...prev, id]);
        } else {
            setSelectedRowIds((prev) => prev.filter((rowId) => rowId !== id));
        }
    };

    const handleSelectAllRows = (checked: boolean) => {
        if (checked) {
            const allIds = records.map((r) => r.id);
            setSelectedRowIds(allIds);
        } else {
            setSelectedRowIds([]);
        }
    };

    // Helper interno per aggiornare al volo un singolo record nella lista della tabella
    const updateLocalRecordInTable = (updatedRecord: any) => {
        setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
        setSelectedRecord(updatedRecord);
    };

    const handleDeleteSelected = async () => {
        if (selectedRowIds.length === 0) return;
        const confirmMessage = selectedRowIds.length === 1
            ? "Vuoi davvero eliminare questo record da Google Maps?"
            : `Vuoi davvero eliminare questi ${selectedRowIds.length} record da Google Maps?`;

        if (confirm(confirmMessage)) {
            const res = await deleteGoogleRecords(selectedRowIds);
            if (res && res.success) {
                alert("Eliminazione completata con successo!");
                setSelectedRowIds([]);
                const response = await getGoogleRecords(search, selectedCategories, page, PAGE_SIZE);
                setRecords(response.data);
                setTotalCount(response.count);
            } else {
                alert("Errore durante l'eliminazione.");
            }
        }
    };

    const handleSaveGoogle = async () => {
        if (!selectedRecord) return null;
        const updatedRecord = await updateGoogleRecord(selectedRecord.id, {
            name: googleName,
            phone: googlePhone,
            online_booking_url: googleBookingUrl,
            updated_at: new Date().toISOString()
        });
        if (updatedRecord) {
            updateLocalRecordInTable(updatedRecord);
            alert("Record Google salvato!");
            return updatedRecord;
        }
        return null;
    };

    const handleCreateDP = async (googleId: string, dpData: any) => {
        const updatedRecord = await createAndLinkDPRecord(googleId, dpData);
        if (updatedRecord) {
            updateLocalRecordInTable(updatedRecord);
            return updatedRecord;
        }
        return null;
    };

    const handleUpdateDP = async (dpId: string, currentName: string, currentCategory: string) => {
        const newName = prompt("Modifica Nome DocPlanner:", currentName);
        if (newName === null) return null;
        const newCat = prompt("Modifica Categoria DocPlanner:", currentCategory);
        if (newCat === null) return null;

        const updatedRecord = await updateDPRecord(dpId, { name: newName, dp_category: newCat });
        if (updatedRecord) {
            updateLocalRecordInTable(updatedRecord);
            alert("Record DocPlanner aggiornato!");
            return updatedRecord;
        }
        return null;
    };

    const handleRemoveLink = async (linkId: string, googleId: string) => {
        if (confirm("Vuoi rimuovere l'associazione con questo record MioDottore?")) {
            const updatedRecord = await deleteLink(linkId, googleId);
            if (updatedRecord) {
                updateLocalRecordInTable(updatedRecord);
                return updatedRecord;
            }
        }
        return null;
    };

    const renderBookingBadge = (url: string) => {
        if (!url) return <Badge variant="secondary" className="text-slate-400 bg-slate-100">No</Badge>;
        const isMioDottore = url.toLowerCase().includes("miodottore") || url.toLowerCase().includes("docplanner");
        if (isMioDottore) {
            return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">MioDottore Online</Badge>;
        }
        return (
            <div className="flex flex-col items-start gap-1 max-w-[200px]">
                <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Altra Piattaforma</Badge>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 underline truncate w-full hover:text-blue-600" onClick={(e) => e.stopPropagation()}>
                    {url}
                </a>
            </div>
        );
    };

    return (
        <div className="p-4 mx-auto space-y-3">
            <div className="flex justify-between items-center">
                {selectedRowIds.length > 0 && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-2 rounded-lg animate-in fade-in duration-200">
                        <span className="text-sm font-medium text-red-700">
                            {selectedRowIds.length} {selectedRowIds.length === 1 ? "riga selezionata" : "righe selezionate"}
                        </span>
                        <Button size="sm" variant="destructive" onClick={handleDeleteSelected}>
                            Elimina selezionati
                        </Button>
                    </div>
                )}
            </div>

            {/* Toolbar Filtri */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-xl border">
                <Input
                    placeholder="Cerca per nome attività..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-md bg-white"
                />

                <CategoryFilter
                    categories={categories}
                    selectedCategories={selectedCategories}
                    onChange={setSelectedCategories}
                />

                {isPending && <span className="text-xs text-slate-400 self-center animate-pulse">Aggiornamento dati...</span>}
            </div>

            <TablePagination
                page={page}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                isPending={isPending}
            />

            {/* Tabella Dati */}
            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={records.length > 0 && selectedRowIds.length === records.length}
                                    onCheckedChange={(checked: boolean | "indeterminate") => handleSelectAllRows(!!checked)}
                                />
                            </TableHead>
                            <TableHead>Nome Struttura (Google)</TableHead>
                            <TableHead>Categoria Google</TableHead>
                            <TableHead>Telefono</TableHead>
                            <TableHead>Prenotazione Online</TableHead>
                            <TableHead>Collegamenti MioDottore</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.map((record) => {
                            const links = record.comparator_link_g_dp || [];
                            const isRowSelected = selectedRowIds.includes(record.id);

                            return (
                                <TableRow
                                    key={record.id}
                                    className={`cursor-pointer transition-colors ${isRowSelected ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-slate-50/85"}`}
                                    onClick={() => {
                                        setSelectedRecord(record);
                                        setIsSheetOpen(true);
                                    }}
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()} className="w-[50px]">
                                        <Checkbox
                                            checked={isRowSelected}
                                            onCheckedChange={(checked: boolean | "indeterminate") => handleSelectRow(record.id, !!checked)}
                                        />
                                    </TableCell>

                                    <TableCell className="font-semibold text-slate-900">{record.name}</TableCell>
                                    <TableCell><Badge variant="outline">{record.google_category || "N/A"}</Badge></TableCell>
                                    <TableCell className="text-sm text-slate-600">{record.phone || "-"}</TableCell>
                                    <TableCell>{renderBookingBadge(record.online_booking_url)}</TableCell>
                                    <TableCell>
                                        {links.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {links.map((l: any) => (
                                                    <Badge key={l.id} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                        ✓ {l.comparator_out_dp?.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">Scollegato</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <TablePagination
                page={page}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                isPending={isPending}
            />

            <ReconciliationSheet
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                selectedRecord={selectedRecord}
                onDeleteActivity={handleDeleteSelected}
                onSaveGoogle={handleSaveGoogle}
                onCreateDP={handleCreateDP}
                onUpdateDP={handleUpdateDP}
                onRemoveLink={handleRemoveLink}
            />
        </div>
    );
}