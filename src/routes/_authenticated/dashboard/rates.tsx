import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { useLocale } from "@/i18n";
import { RateSourcePicker } from "@/components/site/RateSourcePicker";
import { useRateSource } from "@/hooks/use-rate-source";
import { useRoles } from "@/hooks/use-session";
import { AppSelect, NumberField, SearchableSelectField, TextField } from "@/components/site/Field";
import { currencyCodeOptions, findCurrencyCode } from "@/lib/currency-codes";
import { fieldClass, labelClass } from "@/lib/forms";
import { deleteCurrency, listAdminCurrencies, saveCurrency } from "@/lib/portal.functions";
import { ACTIONS_CELL_CONTENT, ACTIONS_COLUMN_ALIGN } from "@/lib/data-table";
import { currencySchema, fieldErrorMap, parseNum, translateFieldErrors, translateRatePairErrors, validateRatePair, resolveValidationMessage } from "@/lib/validation";
import { site } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard/rates")({
  head: () => ({
    meta: [
      { title: `Rates | ${site.name}` },
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

function toRate(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isNaN(n) ? 0 : n;
}

function RatesManagePage() {
  const { t, n, d, dir } = useLocale();
  const sortLabels: Record<SortKey, string> = {
    name_fa: t("admin.sortCurrency"),
    buy_rate: t("admin.sortBuy"),
    sell_rate: t("admin.sortSell"),
    is_active: t("common.status"),
    updated_at: t("admin.sortUpdated"),
  };
  const statusLabels: Record<Exclude<StatusFilter, "all">, string> = {
    active: t("admin.publicVisible"),
    inactive: t("admin.inactive"),
  };

  const { isAdmin } = useRoles();
  const { source, setSource } = useRateSource();
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

  useEffect(() => {
    setForm(emptyForm);
    setErrors({});
    setPage(1);
  }, [source]);

  const currencies = useQuery({
    queryKey: ["admin-currencies", source],
    queryFn: () => listAdminCurrencies(source),
    refetchInterval: 30_000,
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
    rate_source: source,
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
        setErrors(fieldErrorMap(parsed.error, t));
        throw new Error(t("admin.formIncomplete"));
      }
      if (isDuplicateCode(payload.code)) {
        setErrors({ code: t("admin.ratesCodeExists") });
        throw new Error(t("admin.ratesCodeExists"));
      }
      setErrors({});
      return saveCurrency({ data: payload });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(translateFieldErrors(result.fieldErrors, t));
        toast.error(resolveValidationMessage(result.message ?? "validation.operationFailed", t));
        return;
      }
      toast.success(form.id ? t("admin.ratesSaved") : t("admin.ratesCreated"));
      setForm(emptyForm);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCurrency({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(resolveValidationMessage(result.message ?? "validation.operationFailed", t));
        return;
      }
      toast.success(t("admin.ratesDeleted"));
      setForm((prev) => (prev.id ? emptyForm : prev));
      invalidate();
    },
    onError: () => toast.error(t("admin.ratesDeleteFailed")),
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
      toast.error(t("admin.noDataExport"));
      return;
    }
    const header = [
      t("admin.codeLabel"),
      t("admin.nameFaLabel"),
      t("admin.flagLabel"),
      t("admin.buyRateLabel"),
      t("admin.sellRateLabel"),
      t("common.status"),
      t("admin.sortUpdated"),
    ];
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
    toast.success(t("admin.ratesCsvReady", { count: n(filtered.length, 0) }));
  }

  if (!isAdmin) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">{t("admin.accessDeniedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.ratesAccess")}
        </p>
      </div>
    );
  }

  const stats = [
    { label: t("admin.ratesTotal"), value: counts.total, icon: BadgeDollarSign },
    { label: t("admin.publicVisible"), value: counts.active, icon: Eye },
    { label: t("admin.inactive"), value: counts.inactive, icon: EyeOff },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold">{t("admin.ratesTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.ratesSubtitle")}</p>
        </div>
        <RateSourcePicker value={source} onChange={setSource} variant="inline" />
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 p-4 card-elevated">
            <span className="icon-badge size-10 rounded-xl">
              <stat.icon className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-extrabold">{n(stat.value, 0)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 p-5 card-elevated lg:grid-cols-[1fr_13rem_11rem_auto] lg:items-end">
            <div>
              <label className={labelClass} htmlFor="rate-search">
                {t("admin.ratesSearch")}
              </label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="rate-search"
                  dir={dir}
                  className={`${fieldClass} pe-10`}
                  placeholder={t("admin.ratesSearchPh")}
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
                {t("admin.statusFilter")}
              </label>
              <div className="mt-2">
                <AppSelect
                  id="rate-status-filter"
                  value={statusFilter}
                  options={[
                    { value: "all", label: t("admin.allStatuses") },
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
                {t("admin.pageSize")}
              </label>
              <div className="mt-2">
                <AppSelect
                  id="rate-page-size"
                  value={String(pageSize)}
                  options={pageSizes.map((size) => ({
                    value: String(size),
                    label: `${t("admin.rows", { count: n(size, 0) })}`,
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
              <Download className="size-4" /> {t("admin.exportCsv")}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("admin.ratesShowing", { shown: n(paginated.length, 0), total: n(filtered.length, 0), page: n(currentPage, 0), pages: n(totalPages, 0) })}
          </p>

          <div className="overflow-x-auto card-elevated">
            <table
              className={`w-full min-w-[46rem] text-sm ${dir === "ltr" ? "text-left" : "text-right"}`}
            >
              <thead className="bg-secondary/80">
                <tr>
                  {(["name_fa", "buy_rate", "sell_rate", "is_active", "updated_at"] as SortKey[]).map(
                    (key) => (
                      <th key={key} className="px-4 py-3 font-semibold">
                        <button
                          type="button"
                          onClick={() => toggleSort(key)}
                          className="inline-flex items-center gap-1 font-semibold hover:text-primary"
                          aria-label={t("admin.sortBy", { label: sortLabels[key] })}
                        >
                          {sortLabels[key]}
                          <ArrowUpDown
                            className={`size-3.5 ${sortKey === key ? "text-primary" : "opacity-40"}`}
                          />
                          {sortKey === key && (
                            <span className="text-[10px] text-muted-foreground">
                              {sortDir === "asc" ? t("admin.asc") : t("admin.desc")}
                            </span>
                          )}
                        </button>
                      </th>
                    ),
                  )}
                  <th className={`px-4 py-3 font-semibold ${ACTIONS_COLUMN_ALIGN}`}>
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {!currencies.isLoading && filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-muted-foreground" colSpan={columnCount}>
                      {t("admin.ratesEmpty")}
                    </td>
                  </tr>
                )}
                {paginated.map((currency) => {
                  const deleting = remove.isPending && remove.variables === currency.id;
                  const actionsCell = (
                    <td className={`px-4 py-3 ${ACTIONS_COLUMN_ALIGN}`}>
                      <div className={ACTIONS_CELL_CONTENT}>
                        <button
                          type="button"
                          onClick={() => startEdit(currency)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                        >
                          <Pencil className="size-3.5" /> {t("common.edit")}
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => setPendingDelete(currency)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
                        >
                          <Trash2 className="size-3.5" /> {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  );
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
                              <span className="ms-2 rounded-full soft-badge-accent px-2 py-0.5 text-[10px] font-bold">
                                {t("admin.editing")}
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
                      <td className="px-4 py-3 tabular-nums">{n(toRate(currency.buy_rate))}</td>
                      <td className="px-4 py-3 tabular-nums">{n(toRate(currency.sell_rate))}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                            currency.is_active
                              ? "soft-badge-success border"
                              : "bg-secondary text-secondary-foreground border-border"
                          }`}
                        >
                          {currency.is_active ? statusLabels.active : statusLabels.inactive}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {d(currency.updated_at)}
                      </td>
                      {actionsCell}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {t("admin.pageOf", { page: n(currentPage, 0), pages: n(totalPages, 0) })}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40"
              >
                <ChevronRight className="size-3.5" /> {t("common.previous")}
              </button>
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40"
              >
                {t("common.next")} <ChevronLeft className="size-3.5" />
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
          <h2 className="text-base font-bold">{form.id ? t("admin.ratesEdit") : t("admin.ratesAdd")}</h2>
          <SearchableSelectField
            label={t("admin.codeLabel")}
            hint={t("admin.currencyCodeSearchHint")}
            value={form.code}
            error={errors["code"]}
            options={currencyCodeOptions(form.code, { excludeCodes: takenCodes })}
            placeholder={t("admin.selectCurrencyCode")}
            searchPlaceholder={t("admin.searchCurrencyCodePh")}
            onValueChange={(code) => {
              if (isDuplicateCode(code)) {
                setErrors((p) => ({ ...p, code: t("admin.ratesCodeExists") }));
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
            label={t("admin.nameFaCurrency")}
            value={form.name_fa}
            error={errors["name_fa"]}
            onChange={(e) => setForm((p) => ({ ...p, name_fa: e.target.value }))}
            placeholder="USD"
          />
          <TextField
            label={t("admin.flagLabel")}
            hint={t("admin.nameFaAutoHint")}
            value={form.flag}
            readOnly
            tabIndex={-1}
            placeholder="—"
            className="cursor-default bg-muted"
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t("admin.buyRateLabel")}
              value={form.buy}
              error={errors["buy_rate"]}
              placeholder="0.00"
              onValueChange={(buy) => setForm((p) => ({ ...p, buy }))}
              onValidate={(buy) => {
                const pair = translateRatePairErrors(
                  form.sell.trim()
                    ? validateRatePair(buy, form.sell)
                    : validateRatePair(buy, ""),
                  t,
                );
                setErrors((p) => ({
                  ...p,
                  buy_rate: pair.buy_rate ?? "",
                  ...(form.sell.trim() ? { sell_rate: pair.sell_rate ?? "" } : {}),
                }));
              }}
            />
            <NumberField
              label={t("admin.sellRateLabel")}
              value={form.sell}
              error={errors["sell_rate"]}
              placeholder="0.00"
              onValueChange={(sell) => setForm((p) => ({ ...p, sell }))}
              onValidate={(sell) => {
                const pair = translateRatePairErrors(
                  form.buy.trim()
                    ? validateRatePair(form.buy, sell)
                    : validateRatePair("", sell),
                  t,
                );
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
            {t("admin.showOnSite")}
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="size-4" />
              {save.isPending ? t("admin.saving") : form.id ? t("admin.saveChanges") : t("admin.registerCurrency")}
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
                {t("admin.cancelEdit")}
              </button>
            )}
          </div>
        </form>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title={t("admin.ratesDeleteTitle")}
        itemName={
          pendingDelete
            ? `${pendingDelete.name_fa} (${pendingDelete.code})`
            : undefined
        }
        description={t("admin.ratesDeleteDesc")}
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
