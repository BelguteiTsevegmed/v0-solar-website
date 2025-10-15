"use client";

export type SavingsBreakdownProps = {
  selfConsumedKWh: number;
  exportedKWh: number;
  annualSavingsPLN: number;
};

export function SavingsBreakdown({ selfConsumedKWh, exportedKWh, annualSavingsPLN }: SavingsBreakdownProps) {
  const total = Math.max(1, selfConsumedKWh + exportedKWh);
  const selfPct = Math.round((selfConsumedKWh / total) * 100);
  const expPct = 100 - selfPct;
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">Podział produkcji</div>
      <div className="mt-2 h-3 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${selfPct}%` }} aria-label={`Autokonsumpcja ${selfPct}%`} />
      </div>
      <div className="mt-2 flex justify-between text-sm">
        <div>Autokonsumpcja: {selfConsumedKWh.toLocaleString()} kWh ({selfPct}%)</div>
        <div>Eksport: {exportedKWh.toLocaleString()} kWh ({expPct}%)</div>
      </div>
      <div className="mt-3 text-sm text-muted-foreground">Roczne oszczędności</div>
      <div className="text-lg font-semibold">{annualSavingsPLN.toLocaleString()} PLN</div>
    </div>
  );
}


