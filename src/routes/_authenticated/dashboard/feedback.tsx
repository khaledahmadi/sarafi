import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Clock3, Star } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/site/ConfirmDeleteDialog";
import { createFeedbackColumns } from "@/components/site/feedback-columns";
import { AppSelect } from "@/components/site/Field";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/hooks/use-session";
import { useLocale } from "@/i18n";
import {
  filterFeedbacks,
  isFeedbackStatusFilter,
  type FeedbackRow,
  type FeedbackStatusFilter,
} from "@/lib/feedback-table";
import { deleteAdminFeedback, listAdminFeedback, reviewFeedback } from "@/lib/portal.functions";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/feedback")({
  head: () => ({
    meta: [
      { title: `Feedback | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FeedbackAdminPage,
});

function FeedbackAdminPage() {
  const { isStaff } = useRoles();
  const { t, n, d } = useLocale();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<FeedbackRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatusFilter>("all");

  const statusOptions: Array<{ value: FeedbackStatusFilter; label: string }> = [
    { value: "all", label: t("admin.allStatuses") },
    { value: "pending", label: t("admin.feedbackPending") },
    { value: "reviewed", label: t("admin.reviewed") },
  ];

  const feedbacks = useQuery({
    queryKey: ["staff-feedback"],
    queryFn: listAdminFeedback,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["staff-feedback"] });
    void queryClient.invalidateQueries({ queryKey: ["my-feedback"] });
    void queryClient.invalidateQueries({ queryKey: ["manage-stats"] });
  };

  const review = useMutation({
    mutationFn: (id: string) => reviewFeedback({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(t("admin.feedbackReviewedToast"));
      invalidate();
    },
    onError: () => toast.error(t("admin.feedbackReviewFailed")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAdminFeedback({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(t("admin.feedbackDeleted"));
      invalidate();
    },
    onError: () => toast.error(t("admin.feedbackDeleteFailed")),
  });

  const rows = useMemo(() => feedbacks.data ?? [], [feedbacks.data]);
  const pendingCount = rows.filter((row) => row.status === "pending").length;
  const reviewedCount = rows.length - pendingCount;
  const filteredRows = useMemo(() => filterFeedbacks(rows, statusFilter), [rows, statusFilter]);

  const columns = createFeedbackColumns({
    t,
    d,
    n,
    onReview: (row) => review.mutate(row.id),
    onDelete: setPendingDelete,
    reviewingId: review.isPending ? review.variables : null,
  });

  if (!isStaff) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">{t("admin.accessDeniedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("admin.feedbackAccess")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t("admin.feedbackAdminTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("admin.feedbackAdminSubtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("admin.feedbackAll")}
          value={rows.length}
          loading={feedbacks.isLoading}
          icon={Star}
          n={n}
        />
        <StatCard
          label={t("admin.feedbackPending")}
          value={pendingCount}
          loading={feedbacks.isLoading}
          icon={Clock3}
          tone={pendingCount > 0 ? "alert" : "default"}
          n={n}
        />
        <StatCard
          label={t("admin.feedbackReviewed")}
          value={reviewedCount}
          loading={feedbacks.isLoading}
          icon={CheckCircle2}
          n={n}
        />
      </div>

      <section className="space-y-4 p-4 card-elevated sm:p-5">
        <DataTable
          columns={columns}
          data={filteredRows}
          searchKey="search"
          searchPlaceholder={t("admin.feedbackSearchPh")}
          loading={feedbacks.isLoading}
          emptyLabel={
            rows.length === 0 ? t("admin.feedbackEmpty") : t("admin.noResultsFilter")
          }
          toolbar={
            <div className="lg:w-56">
              <AppSelect
                size="sm"
                ariaLabel={t("admin.statusFilter")}
                value={statusFilter}
                onValueChange={(value) => {
                  if (isFeedbackStatusFilter(value)) setStatusFilter(value);
                }}
                options={statusOptions}
              />
            </div>
          }
        />
      </section>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title={t("admin.feedbackDeleteTitle")}
        itemName={pendingDelete?.author}
        description={t("admin.feedbackDeleteDesc")}
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
  tone = "default",
  n,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: typeof Star;
  tone?: "default" | "alert";
  n: (value: number, digits?: number) => string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-3 card-elevated",
        tone === "alert" && "border-warning/40 bg-warning/5",
      )}
    >
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 text-lg font-extrabold">
          {loading ? <Skeleton className="h-6 w-10" /> : n(value, 0)}
        </div>
      </div>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          tone === "alert" ? "bg-warning/20 text-warning-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-3.5" />
      </span>
    </div>
  );
}
