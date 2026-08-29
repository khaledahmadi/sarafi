import type { ColumnDef } from "@tanstack/react-table";
import { Check, Star, Trash2 } from "lucide-react";
import { feedbackStatusLabels, isFeedbackStatus, type FeedbackRow } from "@/lib/feedback-table";
import { faDate, faNum } from "@/lib/site";

type FeedbackColumnsProps = {
  onReview?: (row: FeedbackRow) => void;
  onDelete?: (row: FeedbackRow) => void;
  reviewingId?: string | null;
};

export function createFeedbackColumns({
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
    header: "مشتری",
    cell: ({ row }) => <p className="whitespace-nowrap font-semibold">{row.original.author}</p>,
  });

  columns.push(
    {
      accessorKey: "body",
      header: "متن",
      enableSorting: false,
      cell: ({ row }) => (
        <p className="max-w-sm text-sm leading-6 text-muted-foreground line-clamp-2">
          {row.original.body}
        </p>
      ),
    },
    {
      accessorKey: "rating",
      header: "امتیاز",
      cell: ({ row }) => (
        <span
          className="inline-flex items-center gap-0.5"
          aria-label={`${faNum(row.original.rating, 0)} از ۵`}
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
      header: "تاریخ",
      cell: ({ row }) => (
        <p className="whitespace-nowrap text-muted-foreground">{faDate(row.original.created_at)}</p>
      ),
    },
  );

  columns.push(
    {
      accessorKey: "status",
      header: "وضعیت",
      cell: ({ row }) => {
        const status = isFeedbackStatus(row.original.status) ? row.original.status : "pending";
        switch (status) {
          case "reviewed":
            return (
              <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {feedbackStatusLabels.reviewed}
              </span>
            );
          case "pending":
            return (
              <span className="inline-flex rounded-full border border-warning/40 bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning-foreground">
                {feedbackStatusLabels.pending}
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
      header: "عملیات",
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
              <Check className="size-3.5" /> بررسی شد
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(row.original)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
            >
              <Trash2 className="size-3.5" /> حذف
            </button>
          ) : null}
        </div>
      ),
    },
  );

  return columns;
}
