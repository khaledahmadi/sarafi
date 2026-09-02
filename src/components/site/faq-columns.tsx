import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import type { TranslateFn } from "@/i18n";

export type AdminFaqRow = {
  id: string;
  question: string;
  question_en?: string | null;
  question_ps?: string | null;
  answer: string;
  answer_en?: string | null;
  answer_ps?: string | null;
  keywords: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type FaqColumnsProps = {
  t: TranslateFn;
  editingId?: string | null;
  onEdit: (row: AdminFaqRow) => void;
  onDelete: (row: AdminFaqRow) => void;
};

export function createFaqColumns({
  t,
  editingId = null,
  onEdit,
  onDelete,
}: FaqColumnsProps): ColumnDef<AdminFaqRow>[] {
  return [
    {
      id: "search",
      accessorFn: (row) => `${row.question} ${row.answer} ${row.keywords ?? ""}`,
      enableHiding: true,
    },
    {
      accessorKey: "question",
      header: t("admin.faqsQuestion"),
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{row.original.question}</p>
          {editingId === row.original.id ? (
            <span className="mt-1 inline-flex rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
              {t("admin.editing")}
            </span>
          ) : null}
          <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted-foreground">{row.original.answer}</p>
        </div>
      ),
    },
    {
      accessorKey: "keywords",
      header: t("admin.faqsKeywords"),
      cell: ({ row }) => (
        <p className="max-w-[12rem] text-xs text-muted-foreground">
          {row.original.keywords || t("common.none")}
        </p>
      ),
    },
    {
      accessorKey: "is_active",
      header: t("common.status"),
      cell: ({ row }) =>
        row.original.is_active ? (
          <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            {t("admin.publicVisible")}
          </span>
        ) : (
          <span className="inline-flex rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
            {t("admin.inactive")}
          </span>
        ),
    },
    {
      id: "actions",
      header: t("common.actions"),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(row.original)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
          >
            <Pencil className="size-3.5" /> {t("common.edit")}
          </button>
          <button
            type="button"
            onClick={() => onDelete(row.original)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive"
          >
            <Trash2 className="size-3.5" /> {t("common.delete")}
          </button>
        </div>
      ),
    },
  ];
}
