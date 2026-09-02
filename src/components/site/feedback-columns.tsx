import type { ColumnDef } from "@tanstack/react-table";
import { Check, Star, Trash2 } from "lucide-react";
import type { TranslateFn } from "@/i18n";
import { isFeedbackStatus, type FeedbackRow } from "@/lib/feedback-table";

type FeedbackColumnsProps = {
  t: TranslateFn;
  d: (value: string | Date) => string;
  n: (value: number, fractionDigits?: number) => string;
  onReview?: (row: FeedbackRow) => void;
  onDelete?: (row: FeedbackRow) => void;
  reviewingId?: string | null;
};

export function createFeedbackColumns({
  t,
  d,
  n,
  onReview,
  onDelete,
  reviewingId = null,
}: FeedbackColumnsProps): ColumnDef<FeedbackRow>[] {
  const columns: ColumnDef<FeedbackRow>[] = [
    {
      id: "search",
      accessorFn: (row) => `${row.author} ${row.body}`,
      enableHiding: true,
    },
  ];

  columns.push({
    accessorKey: "author",
    header: t("admin.colCustomer"),
    cell: ({ row }) => <p className="whitespace-nowrap font-semibold">{row.original.author}</p>,
  });

  columns.push(
    {
      accessorKey: "body",
      header: t("admin.colBody"),
      enableSorting: false,
      cell: ({ row }) => (
        <p className="max-w-sm text-sm leading-6 text-muted-foreground line-clamp-2">
          {row.original.body}
        </p>
      ),
    },
    {
      accessorKey: "rating",
      header: t("admin.colRating"),
      cell: ({ row }) => (
        <span
          className="inline-flex items-center gap-0.5"
          aria-label={t("admin.ratingOfFive", { rating: n(row.original.rating, 0) })}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={
                index < row.original.rating
                  ? "size-3.5 fill-accent text-accent"
                  : "size-3.5 text-muted-foreground"
              }
            />
          ))}
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
  );

  columns.push(
    {
      accessorKey: "status",
      header: t("common.status"),
      cell: ({ row }) => {
        const status = isFeedbackStatus(row.original.status) ? row.original.status : "pending";
        switch (status) {
          case "reviewed":
            return (
              <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {t("admin.reviewed")}
              </span>
            );
          case "pending":
            return (
              <span className="inline-flex rounded-full border border-warning/40 bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning-foreground">
                {t("admin.feedbackPending")}
              </span>
            );
          default: {
            const _never: never = status;
            return _never;
          }
        }
      },
    },
    {
      id: "actions",
      header: t("common.actions"),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          {row.original.status === "pending" && onReview ? (
            <button
              type="button"
              disabled={reviewingId === row.original.id}
              onClick={() => onReview(row.original)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              <Check className="size-3.5" /> {t("admin.markReviewed")}
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(row.original)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
            >
              <Trash2 className="size-3.5" /> {t("common.delete")}
            </button>
          ) : null}
        </div>
      ),
    },
  );

  return columns;
}
