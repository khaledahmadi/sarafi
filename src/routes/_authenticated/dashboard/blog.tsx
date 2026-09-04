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
import { useLocale } from "@/i18n";
import { CoverImageField } from "@/components/site/CoverImageField";
import { useRoles } from "@/hooks/use-session";
import { AppSelect, TextAreaField, TextField } from "@/components/site/Field";
import { RichTextEditor } from "@/components/site/RichTextEditor";
import { fieldClass, labelClass } from "@/lib/forms";
import { deleteArticle, listAdminArticles, saveArticle } from "@/lib/portal.functions";
import { articleSchema, fieldErrorMap, translateFieldErrors, uniqueSlug, resolveValidationMessage } from "@/lib/validation";
import { site } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard/blog")({
  head: () => ({
    meta: [
      { title: `Blog | ${site.name}` },
      
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

function BlogAdminPage() {
  const { t, n, d } = useLocale();
  const statusLabels: Record<Exclude<StatusFilter, "all">, string> = {
    published: t("common.published"),
    draft: t("common.draft"),
  };
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
        setErrors(fieldErrorMap(parsed.error, t));
        throw new Error(t("admin.formIncomplete"));
      }
      setErrors({});
      return saveArticle({ data: payload });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(translateFieldErrors(result.fieldErrors, t));
        toast.error(resolveValidationMessage(result.message ?? "validation.operationFailed", t));
        return;
      }
      toast.success(form.id ? t("admin.blogSaved") : t("admin.blogCreated"));
      setForm(emptyForm);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteArticle({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(resolveValidationMessage(result.message ?? "validation.operationFailed", t));
        return;
      }
      toast.success(t("admin.blogDeleted"));
      setForm((prev) => (prev.id ? emptyForm : prev));
      invalidate();
    },
    onError: () => toast.error(t("admin.blogDeleteFailed")),
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
        toast.error(resolveValidationMessage(result.message ?? "validation.operationFailed", t));
        return;
      }
      toast.success(t("admin.blogPublishUpdated"));
      invalidate();
    },
    onError: () => toast.error(t("admin.blogPublishFailed")),
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
      toast.error(t("admin.noDataExport"));
      return;
    }
    const header = [t("admin.titleLabel"), t("admin.slugLabel"), t("admin.excerptLabel"), t("common.status"), t("admin.publishedAt")];
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
    toast.success(t("admin.blogCsvReady", { count: n(filtered.length, 0) }));
  }

  if (!isStaff) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">{t("admin.accessDeniedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.blogAccess")}
        </p>
      </div>
    );
  }

  const stats = [
    { label: t("admin.blogTotal"), value: counts.total, icon: FileText },
    { label: t("common.published"), value: counts.published, icon: Eye },
    { label: t("common.draft"), value: counts.draft, icon: EyeOff },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t("admin.blogTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("admin.blogSubtitle")}</p>
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

      <div className="grid gap-4 p-5 card-elevated lg:grid-cols-[1fr_13rem_11rem_auto] lg:items-end">
        <div>
          <label className={labelClass} htmlFor="blog-search">
            {t("admin.blogSearch")}
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="blog-search"
              dir="rtl"
              className={`${fieldClass} pe-10`}
              placeholder={t("admin.blogSearchPh")}
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
            {t("admin.statusFilter")}
          </label>
          <div className="mt-2">
            <AppSelect
              id="blog-status-filter"
              value={statusFilter}
              options={[
                { value: "all", label: t("admin.allStatuses") },
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
            {t("admin.pageSize")}
          </label>
          <div className="mt-2">
            <AppSelect
              id="blog-page-size"
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
        {t("admin.blogShowing", { shown: n(paginated.length, 0), total: n(filtered.length, 0), page: n(currentPage, 0), pages: n(totalPages, 0) })}
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
            {form.id ? t("admin.blogEdit") : t("admin.blogAdd")}
          </h2>
          <TextField
            label={t("admin.articleTitle")}
            value={form.title_fa}
            error={errors["title_fa"]}
            onChange={(e) => setForm((prev) => ({ ...prev, title_fa: e.target.value }))}
            placeholder={t("admin.articleTitlePh")}
          />
          <TextAreaField
            label={t("admin.articleExcerpt")}
            value={form.excerpt_fa}
            error={errors["excerpt_fa"]}
            onChange={(e) => setForm((prev) => ({ ...prev, excerpt_fa: e.target.value }))}
            placeholder={t("admin.articleExcerptPh")}
          />
          <CoverImageField
            label={t("admin.articleCover")}
            value={form.cover_url}
            {...(errors["cover_url"] ? { error: errors["cover_url"] } : {})}
            onChange={(cover_url) => setForm((prev) => ({ ...prev, cover_url }))}
          />
          <RichTextEditor
            label={t("admin.articleBody")}
            value={form.body_fa}
            error={errors["body_fa"]}
            hint={t("admin.articleBodyHint")}
            onChange={(body_fa) => setForm((prev) => ({ ...prev, body_fa }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.checked }))}
              className="size-4 accent-primary"
            />
            {t("admin.showOnSite")}
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="size-4" />
              {save.isPending ? t("admin.saving") : form.id ? t("admin.saveChanges") : t("admin.registerArticle")}
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
                {t("admin.cancelEdit")}
              </button>
            )}
          </div>
        </form>

        <aside className="space-y-3">
          {!articles.isLoading && filtered.length === 0 && (
            <div className="p-5 text-sm text-muted-foreground card-elevated">{t("admin.blogEmpty")}</div>
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
                        <span className="ms-2 rounded-full soft-badge-accent px-2 py-0.5 text-[10px] font-bold">
                          {t("admin.editing")}
                        </span>
                      )}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {d(article.published_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      article.is_published
                        ? "soft-badge-success border"
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
                    <Pencil className="size-3.5" /> {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePublish.mutate(article)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    {article.is_published ? (
                      <>
                        <EyeOff className="size-3.5" /> {t("admin.unpublishAction")}
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5" /> {t("admin.publishAction")}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setPendingDelete(article)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
                  >
                    <Trash2 className="size-3.5" /> {t("common.delete")}
                  </button>
                </div>
                </div>
              </div>
            );
          })}

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
        </aside>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title={t("admin.blogDeleteTitle")}
        itemName={pendingDelete?.title_fa}
        description={t("admin.blogDeleteDesc")}
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
