"use client";

export type PaybackTimelineProps = {
  capexPLN: number;
  annualSavingsPLN: number;
};

export function PaybackTimeline({ capexPLN, annualSavingsPLN }: PaybackTimelineProps) {
  // Simple cumulative model up to 25 years
  const years = Array.from({ length: 25 }, (_, i) => i + 1);
  let cumulative = -capexPLN;
  const points = years.map((y) => {
    cumulative += annualSavingsPLN;
    return { year: y, value: cumulative };
  });
  const minVal = Math.min(...points.map((p) => p.value), -1);
  const maxVal = Math.max(...points.map((p) => p.value), 1);
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">Kumulowany przepływ gotówki</div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {points.map((p) => {
          const pct = Math.round(((p.value - minVal) / (maxVal - minVal)) * 100);
          return (
            <div key={p.year} className="flex flex-col items-center gap-1">
              <div className="w-2 rounded-full bg-muted overflow-hidden" style={{ height: 60 }}>
                <div
                  className={"w-full bg-primary transition-all"}
                  style={{ height: `${pct}%` }}
                  aria-label={`Rok ${p.year}, ${p.value.toFixed(0)} PLN`}
                />
              </div>
              <div className="text-[10px] text-muted-foreground">{p.year}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


