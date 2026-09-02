import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CircleHelp, Eye, EyeOff, Plus } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/site/ConfirmDeleteDialog";
import { createFaqColumns, type AdminFaqRow } from "@/components/site/faq-columns";
import { TextAreaField, TextField } from "@/components/site/Field";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/hooks/use-session";
import { useLocale } from "@/i18n";
import { deleteFaq, listAdminFaqs, saveFaq } from "@/lib/portal.functions";
import { faqSchema, fieldErrorMap } from "@/lib/validation";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/faqs")({
  head: () => ({
    meta: [
      { title: `FAQ | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FaqsAdminPage,
});

type FormState = {
  id?: string;
  question: string;
  answer: string;
  keywords: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  question: "",
  answer: "",
  keywords: "",
  is_active: true,
};

function FaqsAdminPage() {
  const { isStaff } = useRoles();
  const { t, n } = useLocale();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<AdminFaqRow | null>(null);

  const faqs = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: listAdminFaqs,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    void queryClient.invalidateQueries({ queryKey: ["faqs"] });
  };

  const save = useMutation({
    mutationFn: async (state: FormState) => {
      const payload = {
        ...(state.id ? { id: state.id } : {}),
        question: state.question,
        answer: state.answer,
        keywords: state.keywords.trim() || null,
        sort_order: state.id
          ? (faqs.data?.find((row) => row.id === state.id)?.sort_order ?? 0)
          : (faqs.data ?? []).reduce((max, row) => Math.max(max, row.sort_order), -1) + 1,
        is_active: state.is_active,
      };
      const parsed = faqSchema.safeParse({
        ...payload,
        keywords: state.keywords,
      });
      if (!parsed.success) {
        setErrors(fieldErrorMap(parsed.error));
        throw new Error(t("admin.formIncomplete"));
      }
      setErrors({});
      return saveFaq({ data: payload });
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      toast.success(form.id ? t("admin.faqsSaved") : t("admin.faqsCreated"));
      setForm(emptyForm);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFaq({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(t("admin.faqsDeleted"));
      setForm((prev) => (prev.id ? emptyForm : prev));
      invalidate();
    },
    onError: () => toast.error(t("admin.faqsDeleteFailed")),
  });

  const rows = useMemo(() => faqs.data ?? [], [faqs.data]);
  const activeCount = rows.filter((row) => row.is_active).length;
  const columns = useMemo(
    () =>
      createFaqColumns({
        t,
        editingId: form.id ?? null,
        onEdit: (row) => {
          setErrors({});
          setForm({
            id: row.id,
            question: row.question,
            answer: row.answer,
            keywords: row.keywords ?? "",
            is_active: row.is_active,
          });
        },
        onDelete: setPendingDelete,
      }),
    [t, form.id],
  );

  if (!isStaff) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">{t("admin.accessDeniedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("admin.faqsAccess")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t("admin.faqsTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("admin.faqsSubtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("admin.faqsAll")}
          value={rows.length}
          loading={faqs.isLoading}
          icon={CircleHelp}
          n={n}
        />
        <StatCard
          label={t("admin.faqsPublic")}
          value={activeCount}
          loading={faqs.isLoading}
          icon={Eye}
          n={n}
        />
        <StatCard
          label={t("admin.inactive")}
          value={rows.length - activeCount}
          loading={faqs.isLoading}
          icon={EyeOff}
          n={n}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0 space-y-4 p-4 card-elevated sm:p-5">
          <DataTable
            columns={columns}
            data={rows}
            searchKey="search"
            searchPlaceholder={t("admin.faqsSearchPh")}
            loading={faqs.isLoading}
            emptyLabel={t("admin.faqsEmpty")}
          />
        </section>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(form);
          }}
          className="h-fit space-y-4 p-5 card-elevated"
        >
          <h2 className="text-base font-bold">
            {form.id ? t("admin.faqsEdit") : t("admin.faqsAdd")}
          </h2>
          <TextField
            label={t("admin.faqsQuestion")}
            value={form.question}
            error={errors.question}
            onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
            placeholder={t("admin.faqsQuestionPh")}
          />
          <TextAreaField
            label={t("admin.faqsAnswer")}
            value={form.answer}
            error={errors.answer}
            onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
            placeholder={t("admin.faqsAnswerPh")}
          />
          <TextField
            label={t("admin.faqsKeywords")}
            hint={t("admin.faqsKeywordsHint")}
            value={form.keywords}
            error={errors.keywords}
            onChange={(event) => setForm((prev) => ({ ...prev, keywords: event.target.value }))}
            placeholder={t("admin.faqsKeywordsPh")}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              className="size-4 accent-primary"
            />
            {t("admin.faqsShowChat")}
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              <Plus className="size-4" />
              {save.isPending
                ? t("admin.saving")
                : form.id
                  ? t("admin.saveChanges")
                  : t("admin.faqsRegister")}
            </button>
            {form.id ? (
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
            ) : null}
          </div>
        </form>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title={t("admin.faqsDeleteTitle")}
        itemName={pendingDelete?.question}
        description={t("admin.faqsDeleteDesc")}
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

function StatCard({
  label,
  value,
  loading,
  icon: Icon,
  n,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: typeof CircleHelp;
  n: (value: number, digits?: number) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 card-elevated">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 text-lg font-extrabold">
          {loading ? <Skeleton className="h-6 w-10" /> : n(value, 0)}
        </div>
      </div>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary")}>
        <Icon className="size-3.5" />
      </span>
    </div>
  );
}
