import React from "react";
import Onboarding from "./components/compare/OnboardingScreen";
import Dashboard from "./components/compare/DashboardScreen";

interface PageProps {
  searchParams: Promise<{
    lat?: string;
    lng?: string;
    radius?: string;
    name?: string; // Recuperiamo il nome dell'attività selezionata
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  
  const latStr = resolvedParams.lat;
  const lngStr = resolvedParams.lng;
  const radiusStr = resolvedParams.radius || "15"; // Raggio di default 15km
  const nameStr = resolvedParams.name;

  // Se abbiamo sia latitudine che longitudine, andiamo in Dashboard
  const hasCoordinates = latStr && lngStr;

  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center px-1 pt-1 md:pt-10 pb-12 selection:bg-black selection:text-white">
      
      {hasCoordinates ? (
        /* STATO ATTIVO: Abbiamo la posizione -> Renderizza la Dashboard Reale */
        <Dashboard 
          lat={parseFloat(latStr)} 
          lng={parseFloat(lngStr)} 
          radius={parseFloat(radiusStr)}
          targetName={nameStr}
        />
      ) : (
        /* STATO INIZIALE: Nessuna coordinata -> Mostra l'Onboarding con Autocomplete */
        <Onboarding />
      )}

    </main>
  );
}