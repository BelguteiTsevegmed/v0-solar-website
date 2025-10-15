"use client";

import { useState } from "react";

export function AssumptionsDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-3 hover:bg-accent rounded-md"
        aria-expanded={open}
      >
        <div className="text-sm font-medium">Założenia i formuły</div>
        <div className="text-xs text-muted-foreground">Polski net-billing, uproszczone obliczenia</div>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>Produkcja: kWh = kWp × uzysk specyficzny (domyślnie 950 kWh/kWp/rok)</li>
            <li>Autokonsumpcja: domyślnie 35% (można zmienić w Zaawansowanych)</li>
            <li>Oszczędności: autokonsumpcja × cena zakupu + eksport × cena sprzedaży − O&M</li>
            <li>Zwrot: CAPEX / roczne oszczędności</li>
            <li>ROI: roczne oszczędności / CAPEX</li>
            <li>LCOE: CAPEX / PV produkcji zdyskontowanej (uproszczenie)</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Uwaga: wyniki szacunkowe. Rzeczywisty uzysk zależy od cieniowania, kąta, azymutu i jakości montażu.
          </p>
        </div>
      )}
    </div>
  );
}


