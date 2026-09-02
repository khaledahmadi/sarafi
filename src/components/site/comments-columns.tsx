import type { ColumnDef } from "@tanstack/react-table";
import { Check, Trash2 } from "lucide-react";
import type { TranslateFn } from "@/i18n";
import type { AdminComment } from "@/lib/comments-table";

type CommentsColumnsProps = {
  t: TranslateFn;
  d: (value: string | Date) => string;
  onApprove: (row: AdminComment) => void;
  onDelete: (row: AdminComment) => void;
  approvingId?: string | null;
};

export function createCommentsColumns({
  t,
  d,
  onApprove,
  onDelete,
  approvingId = null,
}: CommentsColumnsProps): ColumnDef<AdminComment>[] {
  return [
    {
      id: "search",
      accessorFn: (row) => `${row.article_title} ${row.author} ${row.body}`,
      enableHiding: true,
    },
    {
      accessorKey: "article_title",
      header: t("admin.colArticle"),
      cell: ({ row }) => (
        <p className="max-w-[12rem] font-semibold">{row.original.article_title}</p>
      ),
    },
    {
      accessorKey: "author",
      header: t("admin.colAuthor"),
      cell: ({ row }) => <p className="whitespace-nowrap">{row.original.author}</p>,
    },
    {
      accessorKey: "body",
      header: t("admin.colCommentBody"),
      enableSorting: false,
      cell: ({ row }) => (
        <p className="max-w-sm text-sm leading-6 text-muted-foreground line-clamp-2">
          {row.original.body}
        </p>
      ),
    },
    {
      id: "kind",
      accessorFn: (row) => (row.is_reply ? t("admin.replyType") : t("admin.commentType")),
      header: t("admin.colKind"),
      cell: ({ getValue }) => (
        <span className="inline-flex rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
          {String(getValue())}
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => (row.is_approved ? t("admin.approved") : t("admin.pendingShort")),
      header: t("common.status"),
      cell: ({ row }) => (
        <span
          className={
            row.original.is_approved
              ? "inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
              : "inline-flex rounded-full border border-warning/40 bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning-foreground"
          }
        >
          {row.original.is_approved ? t("admin.approved") : t("admin.pendingShort")}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: t("admin.colDate"),
      cell: ({ row }) => (
        <p className="whitespace-nowrap text-muted-foreground">{d(row.original.created_at)}</p>
      ),
    },
    {
      id: "actions",
      header: t("common.actions"),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          {row.original.is_approved ? null : (
            <button
              type="button"
              disabled={approvingId === row.original.id}
              onClick={() => onApprove(row.original)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              <Check className="size-3.5" /> {t("admin.approve")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(row.original)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
          >
            <Trash2 className="size-3.5" /> {t("common.delete")}
          </button>
        </div>
      ),
    },
  ];
}
