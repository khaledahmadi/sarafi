import { useId, useMemo, useState } from "react";
import { ArrowLeftRight, Calculator } from "lucide-react";
import { AppSelect, TextField } from "@/components/site/Field";
import { currencyUnitSize } from "@/lib/currency-units";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { pickLocalized, useLocale } from "@/i18n";

type Rate = {
  code: string;
  name_fa: string;
  name_en?: string | null;
  name_ps?: string | null;
  flag: string | null;
  buy_rate: number;
  sell_rate: number;
  updated_at: string;
};

const BASE = site.baseCurrency;

type RateSide = "BUY" | "SELL";

function rateForSide(row: Rate, side: RateSide) {
  const value = side === "BUY" ? row.buy_rate : row.sell_rate;
  return value > 0 ? value : null;
}

/** Convert an amount into AFN using the selected buy or sell rate. */
function toBase(amount: number, code: string, rates: Rate[], side: RateSide) {
  if (code === BASE) return amount;
  const row = rates.find((r) => r.code === code);
  if (!row) return null;
  const rate = rateForSide(row, side);
  if (rate === null) return null;
  return (amount / currencyUnitSize(code)) * rate;
}

function fromBase(amountBase: number, code: string, rates: Rate[], side: RateSide) {
  if (code === BASE) return amountBase;
  const row = rates.find((r) => r.code === code);
  if (!row) return null;
  const rate = rateForSide(row, side);
  if (rate === null) return null;
  return (amountBase / rate) * currencyUnitSize(code);
}

function parseAmount(value: string) {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[^\d.]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function CurrencyConverter({
  rates,
  variant = "standalone",
  compact = false,
}: {
  rates: Rate[];
  variant?: "standalone" | "panel";
  compact?: boolean;
}) {
  const { locale, t, n, dir } = useLocale();
  const options = useMemo(
    () => [
      {
        value: BASE,
        label: `🇦🇫 ${pickLocalized({ name_fa: site.baseCurrencyFa, name_en: "Afghani", name_ps: "افغانۍ" }, "name", locale)} - ${BASE}`,
      },
      ...rates.map((r) => ({
        value: r.code,
        label: `${r.flag ? `${r.flag} ` : ""}${pickLocalized(r, "name", locale)} - ${r.code}`.trim(),
      })),
    ],
    [locale, rates],
  );

  const fromId = useId();
  const toId = useId();
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState<string>(rates[0]?.code ?? BASE);
  const [to, setTo] = useState<string>(BASE);
  const [rateSide, setRateSide] = useState<RateSide>("BUY");

  const value = parseAmount(amount);
  const base = toBase(value, from, rates, rateSide);
  const result = base === null ? null : fromBase(base, to, rates, rateSide);
  const unit = (() => {
    const b = toBase(1, from, rates, rateSide);
    return b === null ? null : fromBase(b, to, rates, rateSide);
  })();

  const rateSideOptions: Array<{ value: RateSide; label: string; hint: string }> = [
    { value: "BUY", label: t("rates.buyRateLabel"), hint: t("rates.buyHint") },
    { value: "SELL", label: t("rates.sellRateLabel"), hint: t("rates.sellHint") },
  ];
  const activeSide = rateSideOptions.find((option) => option.value === rateSide);

  return (
    <div
      className={cn(
        "min-w-0",
        variant === "standalone" &&
          !compact &&
          "rounded-3xl border border-border bg-card p-5 shadow-raised sm:p-6 md:p-7",
        variant === "standalone" &&
          compact &&
          "rounded-2xl border border-border bg-card p-4 shadow-raised sm:p-5",
        variant === "panel" && !compact && "p-4 sm:p-5 md:p-6",
        variant === "panel" && compact && "p-3 sm:p-3.5",
      )}
      dir={dir}
    >
      <div className={cn("flex items-center gap-2.5", compact && "gap-2")}>
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-xl bg-primary text-accent",
            compact ? "size-9 rounded-lg" : "size-11 rounded-2xl",
          )}
        >
          <Calculator className={compact ? "size-4" : "size-5"} />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "font-extrabold text-card-foreground",
              compact ? "text-sm" : "text-base sm:text-lg",
            )}
          >
            {t("rates.converterTitle")}
          </h3>
          {!compact && (
            <p className="mt-0.5 text-xs text-muted-foreground">{t("rates.converterSubtitle")}</p>
          )}
        </div>
      </div>

      <div className={cn("space-y-4", compact ? "mt-3 space-y-3" : "mt-5")}>
        <div>
          {!compact && (
            <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("rates.rateType")}</p>
          )}
          <div
            className={cn(
              "flex w-full gap-1 rounded-xl bg-muted/60 p-1",
              compact ? "text-xs" : "text-sm",
            )}
            role="tablist"
            aria-label={t("rates.rateTypeAria")}
          >
            {rateSideOptions.map((option) => {
              const active = option.value === rateSide;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRateSide(option.value)}
                  className={cn(
                    "flex-1 rounded-lg px-2.5 font-semibold transition-all duration-200",
                    compact ? "min-h-9 py-1.5" : "min-h-11 px-3 py-2",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {!compact && activeSide && (
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{activeSide.hint}</p>
          )}
        </div>

        <TextField
          label={t("rates.amountLabel")}
          fieldSize={compact ? "sm" : "md"}
          inputMode="decimal"
          dir="ltr"
          className={cn(
            "text-left font-semibold tabular-nums",
            compact ? "text-base" : "text-lg",
          )}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1"
        />

        <div
          className={cn(
            "relative rounded-2xl border border-border/70 bg-muted/20",
            compact ? "p-2" : "p-3",
          )}
        >
          <div className={cn("flex flex-col", compact ? "gap-2" : "gap-2.5")}>
            <AppSelect
              id={fromId}
              ariaLabel={t("rates.fromCurrency")}
              size={compact ? "sm" : "md"}
              value={from}
              onValueChange={setFrom}
              options={options}
            />
            <AppSelect
              id={toId}
              ariaLabel={t("rates.toCurrency")}
              size={compact ? "sm" : "md"}
              value={to}
              onValueChange={setTo}
              options={options}
            />
          </div>
          <button
            type="button"
            aria-label={t("rates.swapCurrencies")}
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            className={cn(
              "absolute start-1/2 top-1/2 z-10 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-card bg-primary text-accent shadow-md transition-transform hover:scale-105 rtl:translate-x-1/2",
              compact ? "size-8" : "size-10",
            )}
          >
            <ArrowLeftRight className="size-4 rotate-90" />
          </button>
        </div>

        <div className={cn("rounded-2xl border border-primary/15 bg-primary/5", compact ? "p-3" : "p-4")}>
          <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", !compact && "gap-3")}>
            <div>
              <span className="text-xs font-medium text-muted-foreground">{t("rates.finalAmount")}</span>
              <p
                className={cn(
                  "mt-0.5 font-extrabold tabular-nums text-primary",
                  compact ? "text-xl" : "mt-1 text-3xl",
                )}
                dir="ltr"
              >
                {result === null ? t("common.none") : `${n(result)} ${to}`}
              </p>
            </div>
            {unit !== null && (
              <p
                className={cn(
                  "rounded-lg bg-card/80 font-medium text-muted-foreground ring-1 ring-border/60",
                  compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
                )}
                dir="ltr"
              >
                1 {from} = {n(unit)} {to}
              </p>
            )}
          </div>
          {!compact && (
            <p className="mt-4 text-[11px] leading-6 text-muted-foreground">
              {t("rates.converterDisclaimer", {
                side: activeSide?.label ?? t("rates.selectedRate"),
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
