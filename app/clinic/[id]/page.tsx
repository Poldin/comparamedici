import React from "react";
import Dashboard from "../../components/compare/DashboardScreen";
import Footer from "../../components/Footer";
import { getClinicById } from "@/app/components/compare/actions";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        lat?: string;
        lng?: string;
        radius?: string;
        name?: string;
    }>;
}

export default async function ClinicPage({ params, searchParams }: PageProps) {
    // Anche se non usi "id" per la query di Supabase, serve a Vercel Analytics per mappare il path
    const { id } = await params;
    const resolvedParams = await searchParams;

    let latStr = resolvedParams.lat || "";
    let lngStr = resolvedParams.lng || "";
    const radiusStr = resolvedParams.radius || "15";
    let nameStr = resolvedParams.name;

    // Fallback se mancano le coordinate nell'URL
    if (!latStr || !lngStr) {
        const { data: clinic, error } = await getClinicById(id);

        if (error || !clinic || clinic.lat === null || clinic.lng === null) {
            return (
                <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4">
                    <p className="font-mono text-xs uppercase font-bold text-red-500 text-center">
                        Clinica non trovata o coordinate non disponibili nel Database.
                    </p>
                </main>
            );
        }

        // Assegna i valori recuperati dal DB alle variabili locali
        latStr = clinic.lat.toString();
        lngStr = clinic.lng.toString();
        nameStr = clinic.name || "Clinica";
    }

    return (
        <main className="min-h-screen bg-white text-black flex flex-col items-center px-1 pt-1 md:pt-10 pb-12 selection:bg-black selection:text-white">
            <Dashboard
                lat={parseFloat(latStr)}
                lng={parseFloat(lngStr)}
                radius={parseFloat(radiusStr)}
                targetName={nameStr}
            />

            <div className="w-full mt-12">
                <Footer />
            </div>
        </main>
    );
}