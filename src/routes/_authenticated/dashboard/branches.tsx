import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Globe,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/site/ConfirmDeleteDialog";
import { useLocale } from "@/i18n";
import { useRoles } from "@/hooks/use-session";
import { AppSelect, SearchableSelectField, TextAreaField, TextField } from "@/components/site/Field";
import { cityOptionsForCountry } from "@/lib/cities";
import { countryNameOptions } from "@/lib/country-flags";
import { fieldClass, labelClass } from "@/lib/forms";
import { deleteBranch, listAdminBranches, saveBranch } from "@/lib/portal.functions";
import { ACTIONS_CELL_CONTENT, ACTIONS_COLUMN_ALIGN } from "@/lib/data-table";
import { branchSchema, fieldErrorMap, translateFieldErrors, resolveValidationMessage } from "@/lib/validation";
import { site } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard/branches")({
  head: () => ({
    meta: [
      { title: `Branches | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BranchesManagePage,
});

type Branch = Awaited<ReturnType<typeof listAdminBranches>>[number];

type FormState = {
  id?: string;
  name_fa: string;
  city_fa: string;
  country_fa: string;
  address_fa: string;
  phone: string;
  whatsapp: string;
  map_url: string;
};

type SortKey = "name_fa" | "city_fa" | "country_fa" | "phone";
type SortDir = "asc" | "desc";

const emptyForm: FormState = {
  name_fa: "",
  city_fa: "",
  country_fa: "",
  address_fa: "",
  phone: "",
  whatsapp: "",
  map_url: "",
};

const pageSizes = [5, 10, 25, 50, 100];

function BranchesManagePage() {
  const { t, n, d, dir } = useLocale();
  const sortLabels: Record<SortKey, string> = {
    name_fa: t("admin.sortBranch"),
    city_fa: t("admin.sortCity"),
    country_fa: t("admin.sortCountry"),
    phone: t("admin.contactShort"),
  };

  const { isAdmin } = useRoles();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name_fa");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pendingDelete, setPendingDelete] = useState<Branch | null>(null);

  const branches = useQuery({
    queryKey: ["admin-branches"],
    queryFn: listAdminBranches,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
    void queryClient.invalidateQueries({ queryKey: ["branches"] });
    void queryClient.invalidateQueries({ queryKey: ["manage-stats"] });
  };

  const save = useMutation({
    mutationFn: async (state: FormState) => {
      const payload = {
        ...(state.id ? { id: state.id } : {}),
        name_fa: state.name_fa,
        city_fa: state.city_fa,
        country_fa: state.country_fa,
        address_fa: state.address_fa,
        phone: state.phone,
        whatsapp: state.whatsapp,
        map_url: state.map_url,
        sort_order: state.id
          ? (branches.data?.find((row) => row.id === state.id)?.sort_order ?? 0)
          : Math.max(0, ...(branches.data ?? []).map((row) => row.sort_order)) + 1,
      };
      const parsed = branchSchema.safeParse(payload);
      if (!parsed.success) {
        setErrors(fieldErrorMap(parsed.error, t));
        throw new Error(t("admin.formIncomplete"));
      }
      setErrors({});
      return saveBranch({ data: payload });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(translateFieldErrors(result.fieldErrors, t));
        toast.error(resolveValidationMessage(result.message ?? "validation.operationFailed", t));
        return;
      }
      toast.success(form.id ? t("admin.branchesSaved") : t("admin.branchesCreated"));
      setForm(emptyForm);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBranch({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(resolveValidationMessage(result.message ?? "validation.operationFailed", t));
        return;
      }
      toast.success(t("admin.branchesDeleted"));
      setForm((prev) => (prev.id ? emptyForm : prev));
      invalidate();
    },
    onError: () => toast.error(t("admin.branchesDeleteFailed")),
  });

  const counts = useMemo(() => {
    const all = branches.data ?? [];
    return {
      total: all.length,
      cities: new Set(all.map((row) => row.city_fa.trim()).filter(Boolean)).size,
      countries: new Set(all.map((row) => row.country_fa.trim()).filter(Boolean)).size,
    };
  }, [branches.data]);

  const countryOptions = useMemo(() => {
    const countries = [...new Set((branches.data ?? []).map((row) => row.country_fa.trim()).filter(Boolean))];
    countries.sort((a, b) => a.localeCompare(b, "fa"));
    return [
      { value: "all", label: t("admin.allCountries") },
      ...countries.map((country) => ({ value: country, label: country })),
    ];
  }, [branches.data]);

  const formCountryOptions = useMemo(() => countryNameOptions(form.country_fa), [form.country_fa]);

  const formCityOptions = useMemo(() => {
    const extraCities = (branches.data ?? [])
      .filter((row) => row.country_fa.trim() === form.country_fa.trim())
      .map((row) => row.city_fa);
    return cityOptionsForCountry(form.country_fa, extraCities, form.city_fa);
  }, [branches.data, form.city_fa, form.country_fa]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = (branches.data ?? []).filter((row) => {
      if (countryFilter !== "all" && row.country_fa !== countryFilter) return false;
      if (!term) return true;
      return [row.name_fa, row.city_fa, row.country_fa, row.address_fa ?? "", row.phone ?? "", row.whatsapp ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = (a[sortKey] ?? "").toString();
      const bv = (b[sortKey] ?? "").toString();
      return av.localeCompare(bv, "fa") * dir;
    });
  }, [branches.data, search, countryFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  const columnCount = 5;

  function toggleSort(key: SortKey) {
    setPage(1);
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function startEdit(branch: Branch) {
    setErrors({});
    setForm({
      id: branch.id,
      name_fa: branch.name_fa,
      city_fa: branch.city_fa,
      country_fa: branch.country_fa,
      address_fa: branch.address_fa ?? "",
      phone: branch.phone ?? "",
      whatsapp: branch.whatsapp ?? "",
      map_url: branch.map_url ?? "",
    });
  }

  function exportCsv() {
    if (filtered.length === 0) {
      toast.error(t("admin.noDataExport"));
      return;
    }
    const header = [t("admin.branchNameLabel"), t("admin.branchCityLabel"), t("admin.branchCountryLabel"), t("admin.phoneShort"), t("admin.whatsappShort"), t("admin.addressShort")];
    const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [
      header.map(cell).join(","),
      ...filtered.map((row) =>
        [
          row.name_fa,
          row.country_fa,
          row.city_fa,
          row.address_fa ?? "",
          row.phone ?? "",
          row.whatsapp ?? "",
          row.map_url ?? "",
        ]
          .map(cell)
          .join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sarafi-branches-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("admin.branchesCsvReady", { count: n(filtered.length, 0) }));
  }

  if (!isAdmin) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">{t("admin.accessDeniedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.branchesAccess")}
        </p>
      </div>
    );
  }

  const stats = [
    { label: t("admin.branchesTotal"), value: counts.total, icon: Building2 },
    { label: t("admin.branchesCities"), value: counts.cities, icon: MapPin },
    { label: t("admin.branchesCountries"), value: counts.countries, icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t("admin.branchesTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("admin.branchesSubtitle")}</p>
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
              <label className={labelClass} htmlFor="branch-search">
                {t("admin.branchesSearch")}
              </label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="branch-search"
                  dir={dir}
                  className={`${fieldClass} pe-10`}
                  placeholder={t("admin.branchesSearchPh")}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="branch-country-filter">
                {t("admin.countryFilter")}
              </label>
              <div className="mt-2">
                <AppSelect
                  id="branch-country-filter"
                  value={countryFilter}
                  options={countryOptions}
                  onValueChange={(value) => {
                    setCountryFilter(value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="branch-page-size">
                {t("admin.pageSize")}
              </label>
              <div className="mt-2">
                <AppSelect
                  id="branch-page-size"
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
            {t("admin.branchesShowing", { shown: n(paginated.length, 0), total: n(filtered.length, 0), page: n(currentPage, 0), pages: n(totalPages, 0) })}
          </p>

          <div className="overflow-x-auto card-elevated">
            <table
              className={`w-full min-w-[46rem] text-sm ${dir === "ltr" ? "text-left" : "text-right"}`}
            >
              <thead className="bg-secondary/80">
                <tr>
                  {(["name_fa", "country_fa", "city_fa", "phone"] as SortKey[]).map((key) => (
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
                  ))}
                  <th className={`px-4 py-3 font-semibold ${ACTIONS_COLUMN_ALIGN}`}>
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {!branches.isLoading && filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-muted-foreground" colSpan={columnCount}>
                      {t("admin.branchesEmpty")}
                    </td>
                  </tr>
                )}
                {paginated.map((branch) => {
                  const deleting = remove.isPending && remove.variables === branch.id;
                  const actionsCell = (
                    <td className={`px-4 py-3 ${ACTIONS_COLUMN_ALIGN}`}>
                      <div className={ACTIONS_CELL_CONTENT}>
                        <button
                          type="button"
                          onClick={() => startEdit(branch)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                        >
                          <Pencil className="size-3.5" /> {t("common.edit")}
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => setPendingDelete(branch)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
                        >
                          <Trash2 className="size-3.5" /> {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  );
                  return (
                    <tr
                      key={branch.id}
                      className="border-t border-border transition hover:bg-secondary/40"
                    >
                                            <td className="px-4 py-3">
                        <span className="font-semibold">{branch.name_fa}</span>
                        {form.id === branch.id && (
                          <span className="ms-2 rounded-full soft-badge-accent px-2 py-0.5 text-[10px] font-bold">
                            {t("admin.editing")}
                          </span>
                        )}
                        {branch.address_fa && (
                          <span className="mt-0.5 block line-clamp-1 text-[11px] text-muted-foreground">
                            {branch.address_fa}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{branch.country_fa}</td>
                      <td className="px-4 py-3">{branch.city_fa}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground" dir="ltr">
                        {branch.phone || "—"}
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
          <h2 className="text-base font-bold">{form.id ? t("admin.branchesEdit") : t("admin.branchesAdd")}</h2>
          <TextField
            label={t("admin.branchNameLabel")}
            value={form.name_fa}
            error={errors["name_fa"]}
            onChange={(e) => setForm((p) => ({ ...p, name_fa: e.target.value }))}
            placeholder=""
          />
          <div className="grid grid-cols-2 gap-3">
            <SearchableSelectField
              label={t("admin.branchCountryLabel")}
              hint={t("admin.countrySearchHint")}
              value={form.country_fa}
              error={errors["country_fa"]}
              options={formCountryOptions}
              placeholder={t("admin.selectCountry")}
              searchPlaceholder={t("admin.searchCountryPh")}
              onValueChange={(country_fa) => {
                setErrors((p) => ({ ...p, country_fa: "", city_fa: "" }));
                setForm((p) => ({
                  ...p,
                  country_fa,
                  city_fa: p.country_fa === country_fa ? p.city_fa : "",
                }));
              }}
            />
            <SearchableSelectField
              label={t("admin.branchCityLabel")}
              hint={form.country_fa ? t("admin.citySearchHint") : t("admin.selectCountryFirst")}
              value={form.city_fa}
              error={errors["city_fa"]}
              options={formCityOptions}
              placeholder={form.country_fa ? t("admin.selectCity") : t("admin.selectCountryFirst")}
              searchPlaceholder={t("admin.searchCityPh")}
              disabled={!form.country_fa}
              onValueChange={(city_fa) => {
                setErrors((p) => ({ ...p, city_fa: "" }));
                setForm((p) => ({ ...p, city_fa }));
              }}
            />
          </div>
          <TextAreaField
            label={t("admin.branchAddressOpt")}
            value={form.address_fa}
            error={errors["address_fa"]}
            onChange={(e) => setForm((p) => ({ ...p, address_fa: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t("admin.branchPhoneOpt")}
              dir="ltr"
              className="text-left"
              value={form.phone}
              error={errors["phone"]}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <TextField
              label={t("admin.branchWhatsappOpt")}
              dir="ltr"
              className="text-left"
              value={form.whatsapp}
              error={errors["whatsapp"]}
              onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
            />
          </div>
          <TextField
            label={t("admin.branchMapOpt")}
            dir="ltr"
            className="text-left"
            value={form.map_url}
            error={errors["map_url"]}
            onChange={(e) => setForm((p) => ({ ...p, map_url: e.target.value }))}
            placeholder="https://maps.google.com/…"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="size-4" />
              {save.isPending ? t("admin.saving") : form.id ? t("admin.saveChanges") : t("admin.registerBranch")}
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
        title={t("admin.branchesDeleteTitle")}
        itemName={pendingDelete?.name_fa}
        description={t("admin.branchesDeleteDesc")}
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
