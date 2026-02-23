import { getKpiColor } from "@/lib/kpiColor";
import { cn } from "@/lib/utils/cn";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface KpiCardProps {
  label: string;
  value: string;
  numericValue: number;
  helpText?: string;
  thresholds: {
    green: number;
    yellow: number;
    red: number;
  };
}

export function KpiCard({ label, value, numericValue, helpText, thresholds }: KpiCardProps) {
  const color = getKpiColor(numericValue, thresholds.green, thresholds.yellow);

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        color === "green" && "border-emerald-300 bg-emerald-50/70",
        color === "yellow" && "border-amber-300 bg-amber-50/70",
        color === "red" && "border-rose-300 bg-rose-50/70",
      )}
    >
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-stone-700">
        {label}
        {helpText ? <InfoTooltip text={helpText} /> : null}
      </p>
      <p className="mt-1 text-xl font-semibold text-stone-900">{value}</p>
    </div>
  );
}
