import React from "react";
import Dashboard from "../../components/compare/DashboardScreen";
import Footer from "../../components/Footer";

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

  const latStr = resolvedParams.lat;
  const lngStr = resolvedParams.lng;
  const radiusStr = resolvedParams.radius || "15";
  const nameStr = resolvedParams.name;

  // Protezione nel caso in cui qualcuno atterri sull'URL senza coordinate
  if (!latStr || !lngStr) {
    return (
      <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4">
        <p className="font-mono text-xs uppercase font-bold text-red-500">
          Coordinate mancanti. Impossibile generare il benchmark.
        </p>
      </main>
    );
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