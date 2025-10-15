"use client";

import { Button } from "@/components/ui/button";

export type ShareSummary = {
  sizeKWp: number;
  annualProductionKWh: number;
  annualSavingsPLN: number;
  paybackYears: number | null;
};

export function ShareActions({ summary }: { summary: ShareSummary | null }) {
  function onShareEmail() {
    const subject = encodeURIComponent("Propozycja instalacji PV");
    const body = encodeURIComponent(
      summary
        ? `Moc: ${summary.sizeKWp.toFixed(2)} kWp\nProdukcja: ${summary.annualProductionKWh.toLocaleString()} kWh/rok\nOszczędności: ${summary.annualSavingsPLN.toLocaleString()} PLN/rok\nZwrot: ${summary.paybackYears ?? "> 25"} lat\n\nLink do wyceny: ${typeof window !== "undefined" ? window.location.href : ""}`
        : `Propozycja PV. Link: ${typeof window !== "undefined" ? window.location.href : ""}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function onDownloadPdf() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={onShareEmail}>Wyślij na e-mail</Button>
      <Button variant="outline" onClick={onDownloadPdf}>Pobierz PDF</Button>
      <Button>Przejdź do wyceny</Button>
    </div>
  );
}


