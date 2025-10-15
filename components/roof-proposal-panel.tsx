"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type {
  RoofAnalysis,
  ProposalResult,
  ProposalOptionName,
} from "@/lib/solar-types";
import { POLAND_DEFAULTS } from "@/lib/pricing-poland";
import { computeProposals } from "@/app/actions/proposals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SavingsBreakdown } from "@/components/savings-breakdown";
import { ProposalScenarios } from "@/components/proposal-scenarios";
import { BillBeforeAfter } from "@/components/bill-before-after";
import { PaybackTimeline } from "@/components/payback-timeline";
import { AssumptionsDrawer } from "@/components/assumptions-drawer";
import { ShareActions } from "@/components/share-actions";

const formSchema = z.object({
  monthlyUsageKWh: z.coerce.number().min(10).max(5000),
  buyPrice: z.coerce.number().min(0.1).max(2),
  sellPrice: z.coerce.number().min(0).max(2),
  capexPerKWp: z.coerce.number().min(1000).max(10000),
  omPct: z.coerce.number().min(0).max(10),
  degradationPct: z.coerce.number().min(0).max(5),
  discountPct: z.coerce.number().min(0).max(20),
  lifetimeYears: z.coerce.number().int().min(10).max(35),
  selfConsumptionRatio: z.coerce.number().min(0).max(1),
  moduleWattageW: z.coerce.number().int().min(300).max(600),
});

type FormValues = z.infer<typeof formSchema>;

export type RoofProposalPanelProps = {
  roofAnalysis?: RoofAnalysis | null;
  initialMonthlyUsageKWh?: number;
};

export function RoofProposalPanel({
  roofAnalysis,
  initialMonthlyUsageKWh = 300,
}: RoofProposalPanelProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monthlyUsageKWh: initialMonthlyUsageKWh,
      buyPrice: POLAND_DEFAULTS.buyPricePLNPerKWh,
      sellPrice: POLAND_DEFAULTS.sellPricePLNPerKWh,
      capexPerKWp: POLAND_DEFAULTS.capexPLNPerKWp,
      omPct: POLAND_DEFAULTS.omRatePctPerYear,
      degradationPct: POLAND_DEFAULTS.degradationPctPerYear,
      discountPct: POLAND_DEFAULTS.discountRatePct,
      lifetimeYears: POLAND_DEFAULTS.lifetimeYears,
      selfConsumptionRatio: POLAND_DEFAULTS.selfConsumptionRatio,
      moduleWattageW: POLAND_DEFAULTS.moduleWattageW,
    },
  });

  const values = watch();

  const [result, setResult] = useState<ProposalResult | null>(null);
  const [selected, setSelected] = useState<ProposalOptionName>("SMART_MATCH");
  const [loading, setLoading] = useState(false);

  const selectedScenario = useMemo(() => {
    return result?.scenarios.find((s) => s.name === selected) ?? null;
  }, [result, selected]);

  async function recompute(v: FormValues) {
    setLoading(true);
    const { data } = await computeProposals({
      monthlyUsageKWh: v.monthlyUsageKWh,
      pricingOverrides: {
        buyPricePLNPerKWh: v.buyPrice,
        sellPricePLNPerKWh: v.sellPrice,
        capexPLNPerKWp: v.capexPerKWp,
        omRatePctPerYear: v.omPct,
        degradationPctPerYear: v.degradationPct,
        discountRatePct: v.discountPct,
        lifetimeYears: v.lifetimeYears,
        selfConsumptionRatio: v.selfConsumptionRatio,
        moduleWattageW: v.moduleWattageW,
      },
      roofAnalysis: roofAnalysis ?? null,
    });
    setResult(data ?? null);
    setLoading(false);
  }

  useEffect(() => {
    // initial compute
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    recompute(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute on relevant value changes (debounced simple approach)
  useEffect(() => {
    const id = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      recompute(values);
    }, 250);
    return () => clearTimeout(id);
  }, [
    values.monthlyUsageKWh,
    values.buyPrice,
    values.sellPrice,
    values.capexPerKWp,
    values.omPct,
    values.selfConsumptionRatio,
    values.moduleWattageW,
    values.discountPct,
    values.degradationPct,
    values.lifetimeYears,
  ]);

  const annualSavings = selectedScenario?.annualSavingsPLN ?? 0;
  const annualProduction = selectedScenario?.annualProductionKWh ?? 0;
  const sizeKWp = selectedScenario?.sizeKWp ?? 0;
  const payback = selectedScenario?.paybackYears ?? null;

  function onSensitivity(deltaPricePct: number, deltaUsagePct: number) {
    setValue("buyPrice", +(values.buyPrice * (1 + deltaPricePct)).toFixed(2));
    setValue(
      "monthlyUsageKWh",
      Math.round(values.monthlyUsageKWh * (1 + deltaUsagePct))
    );
  }

  return (
    <div className="space-y-6">
      {/* Header summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border p-4 bg-card text-card-foreground">
        <div>
          <div className="text-xs text-muted-foreground">Roczna produkcja</div>
          <div className="text-xl font-semibold">
            {annualProduction.toLocaleString()} kWh
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">
            Roczne oszczędności
          </div>
          <div className="text-xl font-semibold">
            {annualSavings.toLocaleString()} PLN
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Okres zwrotu</div>
          <div className="text-xl font-semibold">
            {payback ? `${payback} lat` : "> 25 lat"}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Moc systemu</div>
          <div className="text-xl font-semibold">{sizeKWp.toFixed(2)} kWp</div>
        </div>
      </div>

      {/* Inputs */}
      <form
        className="grid gap-3 rounded-lg border p-4"
        onSubmit={handleSubmit(recompute)}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Miesięczne zużycie (kWh)
            </span>
            <Input
              type="number"
              step="1"
              {...register("monthlyUsageKWh", { valueAsNumber: true })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Cena energii (PLN/kWh)
            </span>
            <Input
              type="number"
              step="0.01"
              {...register("buyPrice", { valueAsNumber: true })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Cena sprzedaży (PLN/kWh)
            </span>
            <Input
              type="number"
              step="0.01"
              {...register("sellPrice", { valueAsNumber: true })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Moc modułu (W)
            </span>
            <Input
              type="number"
              step="10"
              {...register("moduleWattageW", { valueAsNumber: true })}
            />
          </label>
        </div>

        <details className="rounded-md bg-muted/40 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Zaawansowane
          </summary>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                CAPEX (PLN/kWp)
              </span>
              <Input
                type="number"
                step="50"
                {...register("capexPerKWp", { valueAsNumber: true })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">O&M (%/rok)</span>
              <Input
                type="number"
                step="0.1"
                {...register("omPct", { valueAsNumber: true })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Degradacja (%/rok)
              </span>
              <Input
                type="number"
                step="0.1"
                {...register("degradationPct", { valueAsNumber: true })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Stopa dyskonta (%)
              </span>
              <Input
                type="number"
                step="0.1"
                {...register("discountPct", { valueAsNumber: true })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Okres życia (lata)
              </span>
              <Input
                type="number"
                step="1"
                {...register("lifetimeYears", { valueAsNumber: true })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Autokonsumpcja
              </span>
              <Input
                type="number"
                step="0.05"
                {...register("selfConsumptionRatio", { valueAsNumber: true })}
              />
            </label>
          </div>
        </details>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting || loading}>
            Przelicz
          </Button>
          <div className="text-xs text-muted-foreground">
            {loading ? "Obliczanie…" : result?.warnings?.[0] ?? ""}
          </div>
        </div>

        {/* Sensitivity toggles */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Wrażliwość:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSensitivity(-0.1, 0)}
          >
            Cena energii −10%
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSensitivity(0.1, 0)}
          >
            Cena energii +10%
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSensitivity(0, -0.1)}
          >
            Zużycie −10%
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSensitivity(0, 0.1)}
          >
            Zużycie +10%
          </Button>
        </div>
      </form>

      {/* Scenarios */}
      <ProposalScenarios
        scenarios={result?.scenarios ?? []}
        selected={selected}
        onSelect={setSelected}
      />

      {/* Savings breakdown */}
      {selectedScenario && (
        <div className="grid gap-6">
          <SavingsBreakdown
            selfConsumedKWh={selectedScenario.selfConsumedKWh}
            exportedKWh={selectedScenario.exportedKWh}
            annualSavingsPLN={selectedScenario.annualSavingsPLN}
          />
          <BillBeforeAfter
            monthlyUsageKWh={values.monthlyUsageKWh}
            buyPrice={values.buyPrice}
            annualSavingsPLN={selectedScenario.annualSavingsPLN}
          />
          <PaybackTimeline
            capexPLN={Math.round(values.capexPerKWp * sizeKWp)}
            annualSavingsPLN={selectedScenario.annualSavingsPLN}
          />
        </div>
      )}

      <AssumptionsDrawer />
      <ShareActions
        summary={
          selectedScenario
            ? {
                sizeKWp: selectedScenario.sizeKWp,
                annualProductionKWh: selectedScenario.annualProductionKWh,
                annualSavingsPLN: selectedScenario.annualSavingsPLN,
                paybackYears: selectedScenario.paybackYears,
              }
            : null
        }
      />
    </div>
  );
}
