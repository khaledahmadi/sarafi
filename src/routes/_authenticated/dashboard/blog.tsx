import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/site/ConfirmDeleteDialog";
import { CoverImageField } from "@/components/site/CoverImageField";
import { useRoles } from "@/hooks/use-session";
import { AppSelect, TextAreaField, TextField } from "@/components/site/Field";
import { RichTextEditor } from "@/components/site/RichTextEditor";
import { fieldClass, labelClass } from "@/lib/forms";
import { deleteArticle, listAdminArticles, saveArticle } from "@/lib/portal.functions";
import { articleSchema, fieldErrorMap, uniqueSlug } from "@/lib/validation";
import { faDate, faNum, site } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard/blog")({
  head: () => ({
    meta: [
      { title: `مدیریت وبلاگ | ${site.name}` },
      { name: "description", content: "ایجاد، ویرایش و انتشار مقالات وبلاگ." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BlogAdminPage,
});

type Article = Awaited<ReturnType<typeof listAdminArticles>>[number];

type FormState = {
  id?: string;
  title_fa: string;
  excerpt_fa: string;
  body_fa: string;
  cover_url: string;
  is_published: boolean;
};

type StatusFilter = "all" | "published" | "draft";

const emptyForm: FormState = {
  title_fa: "",
  excerpt_fa: "",
  body_fa: "",
  cover_url: "",
  is_published: true,
};

const pageSizes = [5, 10, 25, 50, 100];

const statusLabels: Record<Exclude<StatusFilter, "all">, string> = {
  published: "منتشرشده",
  draft: "پیش‌نویس",
};

function BlogAdminPage() {
  const { isStaff } = useRoles();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pendingDelete, setPendingDelete] = useState<Article | null>(null);

  const articles = useQuery({
    queryKey: ["staff-articles"],
    queryFn: listAdminArticles,
  });

  const takenSlugs = (articles.data ?? [])
    .filter((article) => article.id !== form.id)
    .map((article) => article.slug);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["staff-articles"] });
    void queryClient.invalidateQueries({ queryKey: ["articles"] });
    void queryClient.invalidateQueries({ queryKey: ["article"] });
    void queryClient.invalidateQueries({ queryKey: ["manage-stats"] });
  };

  const save = useMutation({
    mutationFn: async (state: FormState) => {
      const payload = {
        ...(state.id ? { id: state.id } : {}),
        slug: state.id
          ? (articles.data?.find((row) => row.id === state.id)?.slug ?? uniqueSlug(state.title_fa, takenSlugs))
          : uniqueSlug(state.title_fa, takenSlugs),
        title_fa: state.title_fa,
        excerpt_fa: state.excerpt_fa,
        body_fa: state.body_fa,
        cover_url: state.cover_url,
        is_published: state.is_published,
      };
      const parsed = articleSchema.safeParse(payload);
      if (!parsed.success) {
        setErrors(fieldErrorMap(parsed.error));
        throw new Error("اطلاعات وارد شده کامل نیست");
      }
      setErrors({});
      return saveArticle({ data: payload });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      toast.success(form.id ? "مقاله ویرایش شد" : "مقاله ثبت شد");
      setForm(emptyForm);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteArticle({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("مقاله حذف شد");
      setForm((prev) => (prev.id ? emptyForm : prev));
      invalidate();
    },
    onError: () => toast.error("حذف مقاله ممکن نشد"),
  });

  const togglePublish = useMutation({
    mutationFn: async (row: Article) =>
      saveArticle({
        data: {
          id: row.id,
          slug: row.slug,
          title_fa: row.title_fa,
          excerpt_fa: row.excerpt_fa,
          body_fa: row.body_fa,
          cover_url: row.cover_url ?? "",
          is_published: !row.is_published,
        },
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("وضعیت انتشار به‌روزرسانی شد");
      invalidate();
    },
    onError: () => toast.error("تغییر وضعیت انتشار ممکن نشد"),
  });

  const counts = useMemo(() => {
    const all = articles.data ?? [];
    return {
      total: all.length,
      published: all.filter((row) => row.is_published).length,
      draft: all.filter((row) => !row.is_published).length,
    };
  }, [articles.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (articles.data ?? []).filter((row) => {
      if (statusFilter === "published" && !row.is_published) return false;
      if (statusFilter === "draft" && row.is_published) return false;
      if (!term) return true;
      return [row.title_fa, row.slug, row.excerpt_fa]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [articles.data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  function startEdit(article: Article) {
    setErrors({});
    setForm({
      id: article.id,
      title_fa: article.title_fa,
      excerpt_fa: article.excerpt_fa,
      body_fa: article.body_fa,
      cover_url: article.cover_url ?? "",
      is_published: article.is_published,
    });
  }

  function exportCsv() {
    if (filtered.length === 0) {
      toast.error("داده‌ای برای خروجی وجود ندارد");
      return;
    }
    const header = ["عنوان", "نشانی", "وضعیت", "تاریخ انتشار", "خلاصه"];
    const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [
      header.map(cell).join(","),
      ...filtered.map((row) =>
        [
          row.title_fa,
          row.slug,
          row.is_published ? statusLabels.published : statusLabels.draft,
          new Date(row.published_at).toISOString().slice(0, 10),
          row.excerpt_fa,
        ]
          .map(cell)
          .join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sarafi-blog-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`خروجی CSV برای ${faNum(filtered.length, 0)} مقاله آماده شد`);
  }

  if (!isStaff) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">دسترسی محدود</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          مدیریت وبلاگ تنها برای کارمندان و مدیران سیستم در دسترس است.
        </p>
      </div>
    );
  }

  const stats = [
    { label: "کل مقالات", value: counts.total, icon: FileText },
    { label: "منتشرشده", value: counts.published, icon: Eye },
    { label: "پیش‌نویس", value: counts.draft, icon: EyeOff },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">مدیریت وبلاگ</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          جست‌وجو کنید، فیلتر بزنید و مقالات را اضافه، ویرایش یا حذف کنید؛ تغییرات در صفحه وبلاگ
          نمایش داده می‌شود.
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

      <div className="grid gap-4 p-5 card-elevated lg:grid-cols-[1fr_13rem_11rem_auto] lg:items-end">
        <div>
          <label className={labelClass} htmlFor="blog-search">
            جست‌وجوی مقاله
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="blog-search"
              dir="rtl"
              className={`${fieldClass} pe-10`}
              placeholder="عنوان، نشانی یا خلاصه"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="blog-status-filter">
            فیلتر وضعیت
          </label>
          <div className="mt-2">
            <AppSelect
              id="blog-status-filter"
              value={statusFilter}
              options={[
                { value: "all", label: "همه وضعیت‌ها" },
                { value: "published", label: statusLabels.published },
                { value: "draft", label: statusLabels.draft },
              ]}
              onValueChange={(value) => {
                setStatusFilter(value as StatusFilter);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="blog-page-size">
            تعداد در هر صفحه
          </label>
          <div className="mt-2">
            <AppSelect
              id="blog-page-size"
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
        نمایش {faNum(paginated.length, 0)} مقاله از {faNum(filtered.length, 0)} نتیجه — صفحه{" "}
        {faNum(currentPage, 0)} از {faNum(totalPages, 0)}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(form);
          }}
          className="space-y-4 p-6 card-elevated"
        >
          <h2 className="text-base font-bold">
            {form.id ? "ویرایش مقاله" : "نوشتن مقاله تازه"}
          </h2>
          <TextField
            label="عنوان مقاله"
            value={form.title_fa}
            error={errors["title_fa"]}
            onChange={(e) => setForm((prev) => ({ ...prev, title_fa: e.target.value }))}
            placeholder="مثلاً راهنمای حواله یوان به چین"
          />
          <TextAreaField
            label="خلاصه مقاله"
            value={form.excerpt_fa}
            error={errors["excerpt_fa"]}
            onChange={(e) => setForm((prev) => ({ ...prev, excerpt_fa: e.target.value }))}
            placeholder="در چند خط موضوع مقاله را توضیح دهید"
          />
          <CoverImageField
            label="تصویر شاخص"
            value={form.cover_url}
            error={errors["cover_url"]}
            onChange={(cover_url) => setForm((prev) => ({ ...prev, cover_url }))}
          />
          <RichTextEditor
            label="متن مقاله"
            value={form.body_fa}
            error={errors["body_fa"]}
            hint="از نوار ابزار برای عنوان‌بندی، فهرست، نقل قول، لینک و بارگذاری تصویر از رایانه استفاده کنید."
            onChange={(body_fa) => setForm((prev) => ({ ...prev, body_fa }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.checked }))}
              className="size-4 accent-primary"
            />
            نمایش در سایت عمومی
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="size-4" />
              {save.isPending ? "در حال ذخیره…" : form.id ? "ذخیره تغییرات" : "ثبت مقاله"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setErrors({});
                }}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold"
              >
                لغو ویرایش
              </button>
            )}
          </div>
        </form>

        <aside className="space-y-3">
          {!articles.isLoading && filtered.length === 0 && (
            <div className="p-5 text-sm text-muted-foreground card-elevated">مقاله‌ای یافت نشد.</div>
          )}
          {paginated.map((article) => {
            const deleting = remove.isPending && remove.variables === article.id;
            return (
              <div key={article.id} className="overflow-hidden card-elevated">
                {article.cover_url ? (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img src={article.cover_url} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold">
                      {article.title_fa}
                      {form.id === article.id && (
                        <span className="ms-2 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                          در حال ویرایش
                        </span>
                      )}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {faDate(article.published_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      article.is_published
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-secondary text-secondary-foreground border-border"
                    }`}
                  >
                    {article.is_published ? statusLabels.published : statusLabels.draft}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(article)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    <Pencil className="size-3.5" /> ویرایش
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePublish.mutate(article)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    {article.is_published ? (
                      <>
                        <EyeOff className="size-3.5" /> پیش‌نویس
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5" /> انتشار
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setPendingDelete(article)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
                  >
                    <Trash2 className="size-3.5" /> حذف
                  </button>
                </div>
                </div>
              </div>
            );
          })}

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
        </aside>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title="حذف مقاله"
        itemName={pendingDelete?.title_fa}
        description="این مقاله از وبلاگ عمومی برداشته می‌شود و دیگر قابل بازیابی نیست."
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
