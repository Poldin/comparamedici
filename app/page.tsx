import React from "react";
import Onboarding from "./components/compare/OnboardingScreen";
import Footer from "./components/Footer";

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center px-1 pt-1 md:pt-10 pb-12 selection:bg-black selection:text-white">
      {/* Mostra sempre l'Onboarding */}
      <Onboarding />

      <div className="w-full mt-12">
        <Footer />
      </div>
    </main>
  );
}