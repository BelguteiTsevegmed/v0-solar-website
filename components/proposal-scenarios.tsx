"use client";

import type { ProposalOptionName, ScenarioMetrics } from "@/lib/solar-types";
import { Button } from "@/components/ui/button";

export type ProposalScenariosProps = {
  scenarios: ScenarioMetrics[];
  selected: ProposalOptionName;
  onSelect: (name: ProposalOptionName) => void;
};

export function ProposalScenarios({ scenarios, selected, onSelect }: ProposalScenariosProps) {
  return (
    <div className="grid gap-3">
      <div className="grid sm:grid-cols-3 gap-3">
        {scenarios.map((s) => (
          <button
            key={s.name}
            onClick={() => onSelect(s.name)}
            className={
              "text-left rounded-lg border p-4 transition-colors " +
              (selected === s.name ? "border-primary bg-primary/5" : "hover:bg-accent")
            }
            aria-pressed={selected === s.name}
            aria-label={`Wybierz scenariusz ${s.name}`}
          >
            <div className="text-xs text-muted-foreground">
              {s.name === "SMART_MATCH" ? "Dopasowanie" : s.name === "MAX_ROI" ? "Max ROI" : "Max Dach"}
            </div>
            <div className="mt-1 text-lg font-semibold">{s.sizeKWp.toFixed(2)} kWp ({s.panels} paneli)</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Produkcja:</span> {s.annualProductionKWh.toLocaleString()} kWh</div>
              <div><span className="text-muted-foreground">Oszczędności:</span> {s.annualSavingsPLN.toLocaleString()} PLN/rok</div>
              <div><span className="text-muted-foreground">Zwrot:</span> {s.paybackYears ? `${s.paybackYears} lat` : "> 25 lat"}</div>
              <div><span className="text-muted-foreground">ROI:</span> {s.roiPct}%</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}


