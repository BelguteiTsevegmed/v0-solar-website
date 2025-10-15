"use client";

import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { useLoading } from "@/lib/loading-context";

const LOADING_STATES = [
  { text: "Analizujemy lokalizację" },
  { text: "Pobieramy dane satelitarne" },
  { text: "Identyfikujemy powierzchnię dachu" },
  { text: "Oceniamy nasłonecznienie" },
  { text: "Szacujemy potencjał energetyczny" },
  { text: "Przygotowujemy rekomendacje" },
];

export default function Loading() {
  const { isLoading, loadingProgress } = useLoading();

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center">
      <MultiStepLoader
        loadingStates={LOADING_STATES}
        loading={isLoading}
        progress={loadingProgress}
        loop={false}
      />

      <div className="text-center space-y-6 px-4 z-[101]">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Przygotowujemy analizę Twojego dachu
        </h1>
      </div>
    </div>
  );
}
