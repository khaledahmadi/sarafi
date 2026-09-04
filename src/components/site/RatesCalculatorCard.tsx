import type { ReactNode } from "react";
import { CurrencyConverter } from "@/components/site/CurrencyConverter";
import { RateSourcePicker } from "@/components/site/RateSourcePicker";
import type { RateSourceId } from "@/lib/rate-sources";
import { cn } from "@/lib/utils";

type Rate = {
  code: string;
  name_fa: string;
  flag: string | null;
  buy_rate: number;
  sell_rate: number;
  updated_at: string;
};

export function RatesCalculatorCard({
  rates,
  source,
  onSourceChange,
  footer,
  className,
  compact = false,
}: {
  rates: Rate[];
  source: RateSourceId;
  onSourceChange: (source: RateSourceId) => void;
  footer?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/20 bg-card shadow-[var(--shadow-raised)] dark:border-border",
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-border/60 bg-muted/25",
          compact ? "px-2.5 py-2" : "px-3 py-3 sm:px-4 sm:py-3.5",
        )}
      >
        <RateSourcePicker
          value={source}
          onChange={onSourceChange}
          variant="inline"
          showLabel={!compact}
          compact
        />
      </div>
      <CurrencyConverter rates={rates} variant="panel" compact={compact} />
      {footer ? (
        <div className={cn("border-t border-border/60 bg-muted/15", compact && "text-sm")}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}
