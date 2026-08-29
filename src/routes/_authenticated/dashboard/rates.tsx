import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpDown,
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/site/ConfirmDeleteDialog";
import { useRoles } from "@/hooks/use-session";
import { AppSelect, NumberField, SearchableSelectField, TextField } from "@/components/site/Field";
import { currencyCodeOptions, findCurrencyCode } from "@/lib/currency-codes";
import { fieldClass, labelClass } from "@/lib/forms";
import { deleteCurrency, listAdminCurrencies, saveCurrency } from "@/lib/portal.functions";
import { currencySchema, fieldErrorMap, parseNum, validateRatePair } from "@/lib/validation";
import { faDate, faNum, site } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard/rates")({
  head: () => ({
    meta: [
      { title: `مدیریت نرخ اسعار | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RatesManagePage,
});

type Currency = Awaited<ReturnType<typeof listAdminCurrencies>>[number];

type FormState = {
  id?: string;
  code: string;
  name_fa: string;
  flag: string;
  buy: string;
  sell: string;
  is_active: boolean;
};

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "name_fa" | "buy_rate" | "sell_rate" | "is_active" | "updated_at";
type SortDir = "asc" | "desc";

const emptyForm: FormState = {
  code: "",
  name_fa: "",
  flag: "",
  buy: "",
  sell: "",
  is_active: true,
};

const pageSizes = [5, 10, 25, 50, 100];

const sortLabels: Record<SortKey, string> = {
  name_fa: "ارز",
  buy_rate: "خرید",
  sell_rate: "فروش",
  is_active: "وضعیت",
  updated_at: "آخرین بروزرسانی",
};

const statusLabels: Record<Exclude<StatusFilter, "all">, string> = {
  active: "نمایش عمومی",
  inactive: "غیرفعال",
};

function toRate(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isNaN(n) ? 0 : n;
}

function RatesManagePage() {
  const { isAdmin } = useRoles();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pendingDelete, setPendingDelete] = useState<Currency | null>(null);

  const currencies = useQuery({
    queryKey: ["admin-currencies"],
    queryFn: listAdminCurrencies,
  });

  const takenCodes = (currencies.data ?? [])
    .filter((currency) => currency.id !== form.id)
    .map((currency) => currency.code);

  function isDuplicateCode(code: string) {
    const normalized = code.trim().toUpperCase();
    return takenCodes.some((taken) => taken.toUpperCase() === normalized);
  }

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-currencies"] });
    void queryClient.invalidateQueries({ queryKey: ["rates"] });
    void queryClient.invalidateQueries({ queryKey: ["manage-stats"] });
  };

  const payloadOf = (state: FormState) => ({
    ...(state.id ? { id: state.id } : {}),
    code: state.code.trim().toUpperCase(),
    name_fa: state.name_fa,
    flag: state.flag,
    buy_rate: parseNum(state.buy),
    sell_rate: parseNum(state.sell),
    is_active: state.is_active,
  });

  const save = useMutation({
    mutationFn: async (state: FormState) => {
      const payload = payloadOf(state);
      const parsed = currencySchema.safeParse(payload);
      if (!parsed.success) {
        setErrors(fieldErrorMap(parsed.error));
        throw new Error("اطلاعات وارد شده کامل نیست");
      }
      if (isDuplicateCode(payload.code)) {
        setErrors({ code: "این کد ارز قبلاً ثبت شده است" });
        throw new Error("این کد ارز قبلاً ثبت شده است");
      }
      setErrors({});
      return saveCurrency({ data: payload });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      toast.success(form.id ? "ارز ویرایش شد" : "ارز جدید ثبت شد");
      setForm(emptyForm);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCurrency({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("ارز حذف شد");
      setForm((prev) => (prev.id ? emptyForm : prev));
      invalidate();
    },
    onError: () => toast.error("حذف ارز ممکن نشد"),
  });

  const counts = useMemo(() => {
    const all = currencies.data ?? [];
    return {
      total: all.length,
      active: all.filter((row) => row.is_active).length,
      inactive: all.filter((row) => !row.is_active).length,
    };
  }, [currencies.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = (currencies.data ?? []).filter((row) => {
      if (statusFilter === "active" && !row.is_active) return false;
      if (statusFilter === "inactive" && row.is_active) return false;
      if (!term) return true;
      return [row.name_fa, row.code, row.flag ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === "buy_rate" || sortKey === "sell_rate") {
        return (toRate(a[sortKey]) - toRate(b[sortKey])) * dir;
      }
      if (sortKey === "is_active") {
        return (Number(a.is_active) - Number(b.is_active)) * dir;
      }
      if (sortKey === "updated_at") {
        return (Date.parse(a.updated_at) - Date.parse(b.updated_at)) * dir;
      }
      return a.name_fa.localeCompare(b.name_fa, "fa") * dir;
    });
  }, [currencies.data, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  const columnCount = 6;

  function toggleSort(key: SortKey) {
    setPage(1);
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "updated_at" ? "desc" : "asc");
  }

  function startEdit(currency: Currency) {
    setErrors({});
    setForm({
      id: currency.id,
      code: currency.code,
      name_fa: currency.name_fa,
      flag: currency.flag ?? "",
      buy: String(currency.buy_rate),
      sell: String(currency.sell_rate),
      is_active: currency.is_active,
    });
  }

  function exportCsv() {
    if (filtered.length === 0) {
      toast.error("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const header = ["کد ارز", "نام فارسی", "پرچم", "نرخ خرید", "نرخ فروش", "وضعیت", "آخرین بروزرسانی"];
    const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [
      header.map(cell).join(","),
      ...filtered.map((row) =>
        [
          row.code,
          row.name_fa,
          row.flag ?? "",
          String(toRate(row.buy_rate)),
          String(toRate(row.sell_rate)),
          row.is_active ? statusLabels.active : statusLabels.inactive,
          new Date(row.updated_at).toISOString().slice(0, 10),
        ]
          .map(cell)
          .join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sarafi-rates-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`خروجی CSV برای ${faNum(filtered.length, 0)} ارز آماده شد`);
  }

  if (!isAdmin) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">دسترسی محدود</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          مدیریت نرخ اسعار تنها برای مدیر سیستم مجاز است.
        </p>
      </div>
    );
  }

  const stats = [
    { label: "کل ارزها", value: counts.total, icon: BadgeDollarSign },
    { label: "نمایش عمومی", value: counts.active, icon: Eye },
    { label: "غیرفعال", value: counts.inactive, icon: EyeOff },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">مدیریت نرخ اسعار</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          جست‌وجو کنید، فیلتر بزنید و ارزها را اضافه، ویرایش یا حذف کنید؛ تغییرات بلافاصله در صفحه
          نرخ لحظه‌ای نمایش داده می‌شود.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 p-4 card-elevated">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <stat.icon className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-extrabold">{faNum(stat.value, 0)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 p-5 card-elevated lg:grid-cols-[1fr_13rem_11rem_auto] lg:items-end">
            <div>
              <label className={labelClass} htmlFor="rate-search">
                جست‌وجوی ارز
              </label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="rate-search"
                  dir="rtl"
                  className={`${fieldClass} pe-10`}
                  placeholder="نام، کد ارز یا پرچم"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="rate-status-filter">
                فیلتر وضعیت
              </label>
              <div className="mt-2">
                <AppSelect
                  id="rate-status-filter"
                  value={statusFilter}
                  options={[
                    { value: "all", label: "همه وضعیت‌ها" },
                    { value: "active", label: statusLabels.active },
                    { value: "inactive", label: statusLabels.inactive },
                  ]}
                  onValueChange={(value) => {
                    setStatusFilter(value as StatusFilter);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="rate-page-size">
                تعداد در هر صفحه
              </label>
              <div className="mt-2">
                <AppSelect
                  id="rate-page-size"
                  value={String(pageSize)}
                  options={pageSizes.map((size) => ({
                    value: String(size),
                    label: `${faNum(size, 0)} ردیف`,
                  }))}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              <Download className="size-4" /> خروجی CSV
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            نمایش {faNum(paginated.length, 0)} ارز از {faNum(filtered.length, 0)} نتیجه — صفحه{" "}
            {faNum(currentPage, 0)} از {faNum(totalPages, 0)}
          </p>

          <div className="overflow-x-auto card-elevated">
            <table className="w-full min-w-[46rem] text-right text-sm">
              <thead className="bg-secondary/80">
                <tr>
                  {(["name_fa", "buy_rate", "sell_rate", "is_active", "updated_at"] as SortKey[]).map(
                    (key) => (
                      <th key={key} className="px-4 py-3 font-semibold">
                        <button
                          type="button"
                          onClick={() => toggleSort(key)}
                          className="inline-flex items-center gap-1 font-semibold hover:text-primary"
                          aria-label={`مرتب‌سازی بر اساس ${sortLabels[key]}`}
                        >
                          {sortLabels[key]}
                          <ArrowUpDown
                            className={`size-3.5 ${sortKey === key ? "text-primary" : "opacity-40"}`}
                          />
                          {sortKey === key && (
                            <span className="text-[10px] text-muted-foreground">
                              {sortDir === "asc" ? "صعودی" : "نزولی"}
                            </span>
                          )}
                        </button>
                      </th>
                    ),
                  )}
                  <th className="px-4 py-3 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {!currencies.isLoading && filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-muted-foreground" colSpan={columnCount}>
                      ارزی با این مشخصات یافت نشد.
                    </td>
                  </tr>
                )}
                {paginated.map((currency) => {
                  const deleting = remove.isPending && remove.variables === currency.id;
                  return (
                    <tr
                      key={currency.id}
                      className="border-t border-border transition hover:bg-secondary/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-base">
                            {currency.flag || "💱"}
                          </span>
                          <span>
                            <span className="font-semibold">{currency.name_fa}</span>
                            {form.id === currency.id && (
                              <span className="ms-2 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                                در حال ویرایش
                              </span>
                            )}
                            <span
                              className="mt-0.5 block font-mono text-[11px] text-muted-foreground"
                              dir="ltr"
                            >
                              {currency.code}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{faNum(toRate(currency.buy_rate))}</td>
                      <td className="px-4 py-3 tabular-nums">{faNum(toRate(currency.sell_rate))}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                            currency.is_active
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-secondary text-secondary-foreground border-border"
                          }`}
                        >
                          {currency.is_active ? statusLabels.active : statusLabels.inactive}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {faDate(currency.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(currency)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                          >
                            <Pencil className="size-3.5" /> ویرایش
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => setPendingDelete(currency)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
                          >
                            <Trash2 className="size-3.5" /> حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              صفحه {faNum(currentPage, 0)} از {faNum(totalPages, 0)}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40"
              >
                <ChevronRight className="size-3.5" /> قبلی
              </button>
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40"
              >
                بعدی <ChevronLeft className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(form);
          }}
          className="h-fit space-y-4 p-5 card-elevated"
        >
          <h2 className="text-base font-bold">{form.id ? "ویرایش ارز" : "افزودن ارز"}</h2>
          <SearchableSelectField
            label="کد ارز"
            hint="کد یا نام ارز را جست‌وجو کنید"
            value={form.code}
            error={errors["code"]}
            options={currencyCodeOptions(form.code, { excludeCodes: takenCodes })}
            placeholder="انتخاب کد ارز"
            searchPlaceholder="جست‌وجوی کد یا نام ارز…"
            onValueChange={(code) => {
              if (isDuplicateCode(code)) {
                setErrors((p) => ({ ...p, code: "این کد ارز قبلاً ثبت شده است" }));
                return;
              }
              const meta = findCurrencyCode(code);
              setErrors((p) => ({ ...p, code: "" }));
              setForm((p) => ({
                ...p,
                code,
                name_fa: meta?.nameFa ?? p.name_fa,
                flag: meta?.flag ?? p.flag,
              }));
            }}
          />
          <TextField
            label="نام فارسی ارز"
            value={form.name_fa}
            error={errors["name_fa"]}
            onChange={(e) => setForm((p) => ({ ...p, name_fa: e.target.value }))}
            placeholder="دالر آمریکا"
          />
          <TextField
            label="پرچم"
            hint="با انتخاب کد ارز به‌صورت خودکار پر می‌شود"
            value={form.flag}
            readOnly
            tabIndex={-1}
            placeholder="—"
            className="cursor-default bg-muted"
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="نرخ خرید"
              value={form.buy}
              error={errors["buy_rate"]}
              placeholder="0.00"
              onValueChange={(buy) => setForm((p) => ({ ...p, buy }))}
              onValidate={(buy) => {
                const pair = form.sell.trim()
                  ? validateRatePair(buy, form.sell)
                  : validateRatePair(buy, "");
                setErrors((p) => ({
                  ...p,
                  buy_rate: pair.buy_rate ?? "",
                  ...(form.sell.trim() ? { sell_rate: pair.sell_rate ?? "" } : {}),
                }));
              }}
            />
            <NumberField
              label="نرخ فروش"
              value={form.sell}
              error={errors["sell_rate"]}
              placeholder="0.00"
              onValueChange={(sell) => setForm((p) => ({ ...p, sell }))}
              onValidate={(sell) => {
                const pair = form.buy.trim()
                  ? validateRatePair(form.buy, sell)
                  : validateRatePair("", sell);
                setErrors((p) => ({
                  ...p,
                  sell_rate: pair.sell_rate ?? "",
                  ...(form.buy.trim() ? { buy_rate: pair.buy_rate ?? "" } : {}),
                }));
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="size-4 accent-primary"
            />
            نمایش در سایت عمومی
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="size-4" />
              {save.isPending ? "در حال ذخیره…" : form.id ? "ذخیره تغییرات" : "ثبت ارز"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setErrors({});
                }}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold"
              >
                لغو ویرایش
              </button>
            )}
          </div>
        </form>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title="حذف ارز"
        itemName={
          pendingDelete
            ? `${pendingDelete.name_fa} (${pendingDelete.code})`
            : undefined
        }
        description="این ارز و نرخ آن از صفحه عمومی برداشته می‌شود و دیگر قابل بازیابی نیست."
        pending={remove.isPending}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
