import { useId, useMemo, useState } from "react";
import { ArrowLeftRight, Calculator } from "lucide-react";
import { AppSelect, TextField } from "@/components/site/Field";
import { faNum, site } from "@/lib/site";

type Rate = {
  code: string;
  name_fa: string;
  flag: string | null;
  buy_rate: number;
  sell_rate: number;
  updated_at: string;
};

const BASE = site.baseCurrency;

/** Every rate is quoted in AFN: buy_rate = what we pay for 1 unit, sell_rate = what we charge. */
function toBase(amount: number, code: string, rates: Rate[]) {
  if (code === BASE) return amount;
  const row = rates.find((r) => r.code === code);
  if (!row || !row.buy_rate) return null;
  return amount * row.buy_rate;
}

function fromBase(amountBase: number, code: string, rates: Rate[]) {
  if (code === BASE) return amountBase;
  const row = rates.find((r) => r.code === code);
  if (!row || !row.sell_rate) return null;
  return amountBase / row.sell_rate;
}

function parseAmount(value: string) {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[^\d.]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function CurrencyConverter({ rates }: { rates: Rate[] }) {
  const options = useMemo(
    () => [
      { value: BASE, label: `🇦🇫 ${site.baseCurrencyFa} - ${BASE}` },
      ...rates.map((r) => ({
        value: r.code,
        label: `${r.flag ? `${r.flag} ` : ""}${r.name_fa} - ${r.code}`.trim(),
      })),
    ],
    [rates],
  );

  const fromId = useId();
  const toId = useId();
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState<string>(rates[0]?.code ?? BASE);
  const [to, setTo] = useState<string>(BASE);

  const value = parseAmount(amount);
  const base = toBase(value, from, rates);
  const result = base === null ? null : fromBase(base, to, rates);
  const unit = (() => {
    const b = toBase(1, from, rates);
    return b === null ? null : fromBase(b, to, rates);
  })();

  return (
    <div className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-raised sm:p-6 md:p-7" dir="rtl">
      <div className="flex items-center justify-center gap-3">
        <div className="min-w-0 text-center">
          <h3 className="text-lg font-extrabold text-card-foreground">ماشین حساب تبدیل ارز</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">بر اساس نرخ زنده صرافی</p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-accent">
          <Calculator className="size-6" />
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <TextField
          label="مقدار"
          inputMode="decimal"
          dir="ltr"
          className="text-left tabular-nums"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1"
        />

        <div className="relative">
          <div className="flex flex-col gap-2">
            <AppSelect
              id={fromId}
              ariaLabel="ارز مبدأ"
              value={from}
              onValueChange={setFrom}
              options={options}
            />
            <AppSelect
              id={toId}
              ariaLabel="ارز مقصد"
              value={to}
              onValueChange={setTo}
              options={options}
            />
          </div>
          <button
            type="button"
            aria-label="جابجایی ارزها"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            className="absolute start-1/2 top-1/2 z-10 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-card bg-primary text-accent shadow-md transition-transform hover:scale-105 rtl:translate-x-1/2"
          >
            <ArrowLeftRight className="size-3.5 rotate-90" />
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/70 p-4">
          <div className="flex flex-row-reverse items-start justify-between gap-4">
            <div className="text-start">
              <span className="text-xs font-medium text-muted-foreground">مقدار نهایی</span>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-primary" dir="ltr">
                {result === null ? "—" : `${faNum(result)} ${to}`}
              </p>
            </div>
            {unit !== null && (
              <p className="text-xs text-muted-foreground" dir="ltr">
                ۱ {from} = {faNum(unit)} {to}
              </p>
            )}
          </div>
          <p className="mt-4 text-[11px] leading-6 text-muted-foreground">
            این مبلغ شامل کمیسیون و هزینه انتقال نمی‌باشد؛ نرخ نهایی در زمان ثبت حواله تأیید
            می‌شود.
          </p>
        </div>
      </div>
    </div>
  );
}
