import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/site/ConfirmDeleteDialog";
import { useLocale } from "@/i18n";
import { useRoles } from "@/hooks/use-session";
import { AppSelect, SelectField, TextAreaField, TextField } from "@/components/site/Field";
import { fieldClass, labelClass } from "@/lib/forms";
import { deleteService, listAdminServices, saveService } from "@/lib/portal.functions";
import { getServiceIcon, getServiceIconLabel, getServiceIconOptions } from "@/lib/service-icons";
import { fieldErrorMap, serviceSchema, uniqueSlug } from "@/lib/validation";
import { site } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard/services")({
  head: () => ({
    meta: [
      { title: `Services | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ServicesManagePage,
});

type Service = Awaited<ReturnType<typeof listAdminServices>>[number];

type FormState = {
  id?: string;
  title_fa: string;
  summary_fa: string;
  icon: string;
  is_active: boolean;
};

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "title_fa" | "icon" | "sort_order" | "is_active";
type SortDir = "asc" | "desc";

const emptyForm: FormState = {
  title_fa: "",
  summary_fa: "",
  icon: "send",
  is_active: true,
};

const pageSizes = [5, 10, 25, 50, 100];

function ServiceIconLabel({ name }: { name: string }) {
  const { t } = useLocale();
  const Icon = getServiceIcon(name);
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="size-4 shrink-0" />
      <span>{getServiceIconLabel(name, t)}</span>
    </span>
  );
}

function ServicesManagePage() {
  const { t, n, d } = useLocale();
  const sortLabels: Record<SortKey, string> = {
    title_fa: t("admin.sortService"),
    icon: t("admin.sortIcon"),
    sort_order: t("admin.sortOrder"),
    is_active: t("common.status"),
  };
  const statusLabels: Record<Exclude<StatusFilter, "all">, string> = {
    active: t("admin.publicVisible"),
    inactive: t("admin.inactive"),
  };

  const { isAdmin } = useRoles();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("sort_order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);

  const services = useQuery({
    queryKey: ["admin-services"],
    queryFn: listAdminServices,
  });

  const takenSlugs = (services.data ?? [])
    .filter((service) => service.id !== form.id)
    .map((service) => service.slug);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    void queryClient.invalidateQueries({ queryKey: ["services"] });
    void queryClient.invalidateQueries({ queryKey: ["manage-stats"] });
  };

  const save = useMutation({
    mutationFn: async (state: FormState) => {
      const payload = {
        ...(state.id ? { id: state.id } : {}),
        slug: state.id
          ? (services.data?.find((row) => row.id === state.id)?.slug ?? uniqueSlug(state.title_fa, takenSlugs))
          : uniqueSlug(state.title_fa, takenSlugs),
        title_fa: state.title_fa,
        summary_fa: state.summary_fa,
        icon: state.icon,
        sort_order: state.id
          ? (services.data?.find((row) => row.id === state.id)?.sort_order ?? 0)
          : Math.max(0, ...(services.data ?? []).map((row) => row.sort_order)) + 1,
        is_active: state.is_active,
      };
      const parsed = serviceSchema.safeParse(payload);
      if (!parsed.success) {
        setErrors(fieldErrorMap(parsed.error));
        throw new Error(t("admin.formIncomplete"));
      }
      setErrors({});
      return saveService({ data: payload });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      toast.success(form.id ? t("admin.servicesSaved") : t("admin.servicesCreated"));
      setForm(emptyForm);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteService({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(t("admin.servicesDeleted"));
      setForm((prev) => (prev.id ? emptyForm : prev));
      invalidate();
    },
    onError: () => toast.error(t("admin.servicesDeleteFailed")),
  });

  const counts = useMemo(() => {
    const all = services.data ?? [];
    return {
      total: all.length,
      active: all.filter((row) => row.is_active).length,
      inactive: all.filter((row) => !row.is_active).length,
    };
  }, [services.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = (services.data ?? []).filter((row) => {
      if (statusFilter === "active" && !row.is_active) return false;
      if (statusFilter === "inactive" && row.is_active) return false;
      if (!term) return true;
      return [row.title_fa, row.slug, row.summary_fa, row.icon]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === "sort_order") {
        return (a.sort_order - b.sort_order) * dir;
      }
      if (sortKey === "is_active") {
        return (Number(a.is_active) - Number(b.is_active)) * dir;
      }
      return a[sortKey].localeCompare(b[sortKey], "fa") * dir;
    });
  }, [services.data, search, statusFilter, sortKey, sortDir]);

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

  function startEdit(service: Service) {
    setErrors({});
    setForm({
      id: service.id,
      title_fa: service.title_fa,
      summary_fa: service.summary_fa,
      icon: service.icon,
      is_active: service.is_active,
    });
  }

  function exportCsv() {
    if (filtered.length === 0) {
      toast.error(t("admin.noDataExport"));
      return;
    }
    const header = [t("admin.titleLabel"), t("admin.slugLabel"), t("admin.descLabel"), t("admin.serviceIconLabel"), t("admin.serviceOrderLabel"), t("common.status")];
    const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [
      header.map(cell).join(","),
      ...filtered.map((row) =>
        [
          row.title_fa,
          row.slug,
          row.icon,
          String(row.sort_order),
          row.is_active ? statusLabels.active : statusLabels.inactive,
          row.summary_fa,
        ]
          .map(cell)
          .join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sarafi-services-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("admin.servicesCsvReady", { count: n(filtered.length, 0) }));
  }

  if (!isAdmin) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">{t("admin.accessDeniedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.servicesAccess")}
        </p>
      </div>
    );
  }

  const stats = [
    { label: t("admin.servicesTotal"), value: counts.total, icon: Sparkles },
    { label: t("admin.publicVisible"), value: counts.active, icon: Eye },
    { label: t("admin.inactive"), value: counts.inactive, icon: EyeOff },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t("admin.servicesTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("admin.servicesSubtitle")}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 p-4 card-elevated">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
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
              <label className={labelClass} htmlFor="service-search">
                {t("admin.servicesSearch")}
              </label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="service-search"
                  dir="rtl"
                  className={`${fieldClass} pe-10`}
                  placeholder={t("admin.servicesSearchPh")}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="service-status-filter">
                {t("admin.statusFilter")}
              </label>
              <div className="mt-2">
                <AppSelect
                  id="service-status-filter"
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
              <label className={labelClass} htmlFor="service-page-size">
                {t("admin.pageSize")}
              </label>
              <div className="mt-2">
                <AppSelect
                  id="service-page-size"
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
            {t("admin.servicesShowing", { shown: n(paginated.length, 0), total: n(filtered.length, 0), page: n(currentPage, 0), pages: n(totalPages, 0) })}
          </p>

          <div className="overflow-x-auto card-elevated">
            <table className="w-full min-w-[46rem] text-right text-sm">
              <thead className="bg-secondary/80">
                <tr>
                  {(["title_fa", "icon", "sort_order", "is_active"] as SortKey[]).map(
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
                  <th className="px-4 py-3 font-semibold">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {!services.isLoading && filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-muted-foreground" colSpan={columnCount}>
                      {t("admin.servicesEmpty")}
                    </td>
                  </tr>
                )}
                {paginated.map((service) => {
                  const deleting = remove.isPending && remove.variables === service.id;
                  return (
                    <tr
                      key={service.id}
                      className="border-t border-border transition hover:bg-secondary/40"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold">{service.title_fa}</span>
                        {form.id === service.id && (
                          <span className="ms-2 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                            {t("admin.editing")}
                          </span>
                        )}
                        <span className="mt-0.5 block line-clamp-1 text-[11px] text-muted-foreground">
                          {service.summary_fa}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ServiceIconLabel name={service.icon} />
                      </td>
                      <td className="px-4 py-3 tabular-nums">{n(service.sort_order, 0)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                            service.is_active
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-secondary text-secondary-foreground border-border"
                          }`}
                        >
                          {service.is_active ? statusLabels.active : statusLabels.inactive}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(service)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                          >
                            <Pencil className="size-3.5" /> {t("common.edit")}
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => setPendingDelete(service)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
                          >
                            <Trash2 className="size-3.5" /> {t("common.delete")}
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
          <h2 className="text-base font-bold">{form.id ? t("admin.servicesEdit") : t("admin.servicesAdd")}</h2>
          <TextField
            label={t("admin.serviceTitleLabel")}
            value={form.title_fa}
            error={errors["title_fa"]}
            onChange={(e) => setForm((prev) => ({ ...prev, title_fa: e.target.value }))}
            placeholder=""
          />
          <TextAreaField
            label={t("admin.serviceDescLabel")}
            value={form.summary_fa}
            error={errors["summary_fa"]}
            onChange={(e) => setForm((p) => ({ ...p, summary_fa: e.target.value }))}
          />
          <SelectField
            label={t("admin.serviceIconLabel")}
            value={form.icon}
            options={getServiceIconOptions(t)}
            error={errors["icon"]}
            onValueChange={(icon) => setForm((p) => ({ ...p, icon }))}
          />
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
              {save.isPending ? t("admin.saving") : form.id ? t("admin.saveChanges") : t("admin.registerService")}
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
        title={t("admin.servicesDeleteTitle")}
        itemName={pendingDelete?.title_fa}
        description={t("admin.servicesDeleteDesc")}
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
