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
import { useRoles } from "@/hooks/use-session";
import { AppSelect, SearchableSelectField, TextAreaField, TextField } from "@/components/site/Field";
import { cityOptionsForCountry } from "@/lib/cities";
import { countryNameOptions } from "@/lib/country-flags";
import { fieldClass, labelClass } from "@/lib/forms";
import { deleteBranch, listAdminBranches, saveBranch } from "@/lib/portal.functions";
import { branchSchema, fieldErrorMap } from "@/lib/validation";
import { faNum, site } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard/branches")({
  head: () => ({
    meta: [
      { title: `مدیریت نمایندگی‌ها | ${site.name}` },
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

const sortLabels: Record<SortKey, string> = {
  name_fa: "نمایندگی",
  city_fa: "شهر",
  country_fa: "کشور",
  phone: "تماس",
};

function BranchesManagePage() {
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
        setErrors(fieldErrorMap(parsed.error));
        throw new Error("اطلاعات وارد شده کامل نیست");
      }
      setErrors({});
      return saveBranch({ data: payload });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      toast.success(form.id ? "نمایندگی ویرایش شد" : "نمایندگی جدید ثبت شد");
      setForm(emptyForm);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBranch({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("نمایندگی حذف شد");
      setForm((prev) => (prev.id ? emptyForm : prev));
      invalidate();
    },
    onError: () => toast.error("حذف نمایندگی ممکن نشد"),
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
      { value: "all", label: "همه کشورها" },
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
      toast.error("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const header = ["نام", "کشور", "شهر", "آدرس", "تلفن", "واتساپ", "نقشه"];
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
    toast.success(`خروجی CSV برای ${faNum(filtered.length, 0)} نمایندگی آماده شد`);
  }

  if (!isAdmin) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">دسترسی محدود</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          مدیریت نمایندگی‌ها تنها برای مدیر سیستم مجاز است.
        </p>
      </div>
    );
  }

  const stats = [
    { label: "کل نمایندگی‌ها", value: counts.total, icon: Building2 },
    { label: "شهرها", value: counts.cities, icon: MapPin },
    { label: "کشورها", value: counts.countries, icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">مدیریت نمایندگی‌ها</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          جست‌وجو کنید، فیلتر بزنید و نمایندگی‌ها را اضافه، ویرایش یا حذف کنید؛ تغییرات در صفحه
          نمایندگی‌ها نمایش داده می‌شود.
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
              <label className={labelClass} htmlFor="branch-search">
                جست‌وجوی نمایندگی
              </label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="branch-search"
                  dir="rtl"
                  className={`${fieldClass} pe-10`}
                  placeholder="نام، شهر، کشور، آدرس یا شماره تماس"
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
                فیلتر کشور
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
                تعداد در هر صفحه
              </label>
              <div className="mt-2">
                <AppSelect
                  id="branch-page-size"
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
            نمایش {faNum(paginated.length, 0)} نمایندگی از {faNum(filtered.length, 0)} نتیجه — صفحه{" "}
            {faNum(currentPage, 0)} از {faNum(totalPages, 0)}
          </p>

          <div className="overflow-x-auto card-elevated">
            <table className="w-full min-w-[46rem] text-right text-sm">
              <thead className="bg-secondary/80">
                <tr>
                  {(["name_fa", "country_fa", "city_fa", "phone"] as SortKey[]).map((key) => (
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
                  ))}
                  <th className="px-4 py-3 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {!branches.isLoading && filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-muted-foreground" colSpan={columnCount}>
                      نمایندگی‌ای با این مشخصات یافت نشد.
                    </td>
                  </tr>
                )}
                {paginated.map((branch) => {
                  const deleting = remove.isPending && remove.variables === branch.id;
                  return (
                    <tr
                      key={branch.id}
                      className="border-t border-border transition hover:bg-secondary/40"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold">{branch.name_fa}</span>
                        {form.id === branch.id && (
                          <span className="ms-2 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                            در حال ویرایش
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
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(branch)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                          >
                            <Pencil className="size-3.5" /> ویرایش
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => setPendingDelete(branch)}
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
          <h2 className="text-base font-bold">{form.id ? "ویرایش نمایندگی" : "افزودن نمایندگی"}</h2>
          <TextField
            label="نام نمایندگی"
            value={form.name_fa}
            error={errors["name_fa"]}
            onChange={(e) => setForm((p) => ({ ...p, name_fa: e.target.value }))}
            placeholder="دفتر مرکزی کابل"
          />
          <div className="grid grid-cols-2 gap-3">
            <SearchableSelectField
              label="کشور"
              hint="کشور را جست‌وجو و انتخاب کنید"
              value={form.country_fa}
              error={errors["country_fa"]}
              options={formCountryOptions}
              placeholder="انتخاب کشور"
              searchPlaceholder="جست‌وجوی کشور…"
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
              label="شهر"
              hint={form.country_fa ? "شهر را جست‌وجو و انتخاب کنید" : "ابتدا کشور را انتخاب کنید"}
              value={form.city_fa}
              error={errors["city_fa"]}
              options={formCityOptions}
              placeholder={form.country_fa ? "انتخاب شهر" : "ابتدا کشور را انتخاب کنید"}
              searchPlaceholder="جست‌وجوی شهر…"
              disabled={!form.country_fa}
              onValueChange={(city_fa) => {
                setErrors((p) => ({ ...p, city_fa: "" }));
                setForm((p) => ({ ...p, city_fa }));
              }}
            />
          </div>
          <TextAreaField
            label="آدرس (اختیاری)"
            value={form.address_fa}
            error={errors["address_fa"]}
            onChange={(e) => setForm((p) => ({ ...p, address_fa: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="شماره تماس (اختیاری)"
              dir="ltr"
              className="text-left"
              value={form.phone}
              error={errors["phone"]}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <TextField
              label="واتساپ (اختیاری)"
              dir="ltr"
              className="text-left"
              value={form.whatsapp}
              error={errors["whatsapp"]}
              onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
            />
          </div>
          <TextField
            label="لینک نقشه (اختیاری)"
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
              {save.isPending ? "در حال ذخیره…" : form.id ? "ذخیره تغییرات" : "ثبت نمایندگی"}
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
        title="حذف نمایندگی"
        itemName={pendingDelete?.name_fa}
        description="این نمایندگی از صفحه عمومی سایت برداشته می‌شود و دیگر قابل بازیابی نیست."
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
