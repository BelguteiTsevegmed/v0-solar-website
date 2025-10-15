"use client";

export type BillBeforeAfterProps = {
  monthlyUsageKWh: number;
  buyPrice: number; // PLN/kWh
  annualSavingsPLN: number;
};

export function BillBeforeAfter({ monthlyUsageKWh, buyPrice, annualSavingsPLN }: BillBeforeAfterProps) {
  const beforeMonthlyPLN = +(monthlyUsageKWh * buyPrice).toFixed(0);
  const afterMonthlyPLN = Math.max(0, Math.round(beforeMonthlyPLN - annualSavingsPLN / 12));
  const max = Math.max(beforeMonthlyPLN, afterMonthlyPLN, 1);
  const beforePct = Math.round((beforeMonthlyPLN / max) * 100);
  const afterPct = Math.round((afterMonthlyPLN / max) * 100);
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">Rachunek miesięczny (szacunek)</div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Przed</div>
          <div className="mt-1 h-3 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-destructive" style={{ width: `${beforePct}%` }} />
          </div>
          <div className="mt-1 text-sm font-semibold">{beforeMonthlyPLN.toLocaleString()} PLN</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Po</div>
          <div className="mt-1 h-3 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${afterPct}%` }} />
          </div>
          <div className="mt-1 text-sm font-semibold">{afterMonthlyPLN.toLocaleString()} PLN</div>
        </div>
      </div>
    </div>
  );
}


