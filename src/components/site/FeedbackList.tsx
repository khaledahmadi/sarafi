import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paginateFeedbacks, PUBLIC_FEEDBACK_PAGE_SIZE, type FeedbackRow } from "@/lib/feedback-table";
import { faDate, faNum } from "@/lib/site";

function FeedbackCard({ row }: { row: FeedbackRow }) {
  return (
    <article className="flex h-full flex-col p-5 card-elevated">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{row.author}</p>
          <time className="mt-1 block text-xs text-muted-foreground" dateTime={row.created_at}>
            {faDate(row.created_at)}
          </time>
        </div>
        <span
          className="inline-flex items-center gap-0.5"
          aria-label={`${faNum(row.rating, 0)} از ۵`}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={
                index < row.rating
                  ? "size-3.5 fill-accent text-accent"
                  : "size-3.5 text-muted-foreground"
              }
            />
          ))}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">{row.body}</p>
    </article>
  );
}

function FeedbackListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: PUBLIC_FEEDBACK_PAGE_SIZE }, (_, index) => (
        <div key={index} className="space-y-3 p-5 card-elevated">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

export function FeedbackList({
  rows,
  page,
  onPageChange,
  loading,
}: {
  rows: FeedbackRow[];
  page: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}) {
  const { items, currentPage, totalPages, total } = paginateFeedbacks(rows, page);

  if (loading) {
    return <FeedbackListSkeleton />;
  }

  if (total === 0) {
    return (
      <p className="rounded-2xl px-5 py-8 text-center text-sm text-muted-foreground card-elevated">
        هنوز بازخوردی ثبت نشده است.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((row) => (
          <FeedbackCard key={row.id} row={row} />
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            صفحه {faNum(currentPage, 0)} از {faNum(totalPages, 0)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronRight className="size-4" />
              قبلی
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              بعدی
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
