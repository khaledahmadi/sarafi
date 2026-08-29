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
import {
  filterFeedbacks,
  feedbackStatusLabels,
  isFeedbackStatusFilter,
  type FeedbackRow,
  type FeedbackStatusFilter,
} from "@/lib/feedback-table";
import { deleteAdminFeedback, listAdminFeedback, reviewFeedback } from "@/lib/portal.functions";
import { faNum, site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/feedback")({
  head: () => ({
    meta: [
      { title: `بازخورد مشتریان | ${site.name}` },
      { name: "description", content: "بررسی و مدیریت بازخورد مشتریان." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FeedbackAdminPage,
});

const statusOptions: Array<{ value: FeedbackStatusFilter; label: string }> = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "pending", label: feedbackStatusLabels.pending },
  { value: "reviewed", label: feedbackStatusLabels.reviewed },
];

function FeedbackAdminPage() {
  const { isStaff } = useRoles();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<FeedbackRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatusFilter>("all");

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
      toast.success("بازخورد بررسی شد");
      invalidate();
    },
    onError: () => toast.error("بررسی بازخورد ممکن نشد"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAdminFeedback({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("بازخورد حذف شد");
      invalidate();
    },
    onError: () => toast.error("حذف بازخورد ممکن نشد"),
  });

  const rows = useMemo(() => feedbacks.data ?? [], [feedbacks.data]);
  const pendingCount = rows.filter((row) => row.status === "pending").length;
  const reviewedCount = rows.length - pendingCount;
  const filteredRows = useMemo(() => filterFeedbacks(rows, statusFilter), [rows, statusFilter]);

  const columns = createFeedbackColumns({
    onReview: (row) => review.mutate(row.id),
    onDelete: setPendingDelete,
    reviewingId: review.isPending ? review.variables : null,
  });

  if (!isStaff) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">دسترسی محدود</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          مدیریت بازخورد تنها برای کارمندان و مدیران سیستم در دسترس است.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold text-primary">مدیریت محتوا</p>
        <h1 className="mt-1 text-2xl font-extrabold">بازخورد مشتریان</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          جست‌وجو، فیلتر و بررسی بازخوردهای ثبت‌شده توسط مشتریان.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="همه بازخوردها"
          value={rows.length}
          loading={feedbacks.isLoading}
          icon={Star}
        />
        <StatCard
          label="در انتظار بررسی"
          value={pendingCount}
          loading={feedbacks.isLoading}
          icon={Clock3}
          tone={pendingCount > 0 ? "alert" : "default"}
        />
        <StatCard
          label="بررسی‌شده"
          value={reviewedCount}
          loading={feedbacks.isLoading}
          icon={CheckCircle2}
        />
      </div>

      <section className="space-y-4 p-4 card-elevated sm:p-5">
        <DataTable
          columns={columns}
          data={filteredRows}
          searchKey="search"
          searchPlaceholder="جست‌وجو در مشتری یا متن…"
          loading={feedbacks.isLoading}
          emptyLabel={
            rows.length === 0 ? "بازخوردی ثبت نشده است." : "با این فیلتر نتیجه‌ای پیدا نشد."
          }
          toolbar={
            <div className="lg:w-56">
              <AppSelect
                size="sm"
                ariaLabel="فیلتر وضعیت"
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
        title="حذف بازخورد"
        itemName={pendingDelete?.author}
        description="این بازخورد برای همیشه حذف می‌شود و دیگر قابل بازیابی نیست."
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
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: typeof Star;
  tone?: "default" | "alert";
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
          {loading ? <Skeleton className="h-6 w-10" /> : faNum(value, 0)}
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
