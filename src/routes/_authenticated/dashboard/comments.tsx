import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Clock3, MessageSquare } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/site/ConfirmDeleteDialog";
import { createCommentsColumns } from "@/components/site/comments-columns";
import { AppSelect } from "@/components/site/Field";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/hooks/use-session";
import {
  filterComments,
  isCommentStatusFilter,
  isCommentTypeFilter,
  type AdminComment,
  type CommentStatusFilter,
  type CommentTypeFilter,
} from "@/lib/comments-table";
import { approveComment, deleteComment, listAdminComments } from "@/lib/portal.functions";
import { faNum, site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/comments")({
  head: () => ({
    meta: [
      { title: `نظرات | ${site.name}` },
      { name: "description", content: "بررسی و مدیریت نظرات خوانندگان." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CommentsAdminPage,
});

const statusOptions: Array<{ value: CommentStatusFilter; label: string }> = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "pending", label: "در انتظار" },
  { value: "approved", label: "تأییدشده" },
];

const typeOptions: Array<{ value: CommentTypeFilter; label: string }> = [
  { value: "all", label: "همه انواع" },
  { value: "comment", label: "نظر" },
  { value: "reply", label: "پاسخ" },
];

function CommentsAdminPage() {
  const { isStaff } = useRoles();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<AdminComment | null>(null);
  const [statusFilter, setStatusFilter] = useState<CommentStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<CommentTypeFilter>("all");

  const comments = useQuery({
    queryKey: ["staff-comments"],
    queryFn: listAdminComments,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["staff-comments"] });
    void queryClient.invalidateQueries({ queryKey: ["article-comments"] });
    void queryClient.invalidateQueries({ queryKey: ["manage-stats"] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => approveComment({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("نظر تأیید شد");
      invalidate();
    },
    onError: () => toast.error("تأیید نظر ممکن نشد"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteComment({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("نظر حذف شد");
      invalidate();
    },
    onError: () => toast.error("حذف نظر ممکن نشد"),
  });

  const rows = useMemo(() => comments.data ?? [], [comments.data]);
  const pendingCount = rows.filter((row) => !row.is_approved).length;
  const approvedCount = rows.length - pendingCount;
  const filteredRows = useMemo(
    () => filterComments(rows, statusFilter, typeFilter),
    [rows, statusFilter, typeFilter],
  );

  const columns = createCommentsColumns({
    onApprove: (row) => approve.mutate(row.id),
    onDelete: setPendingDelete,
    approvingId: approve.isPending ? approve.variables : null,
  });

  if (!isStaff) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">دسترسی محدود</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          مدیریت نظرات تنها برای کارمندان و مدیران سیستم در دسترس است.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold text-primary">مدیریت محتوا</p>
        <h1 className="mt-1 text-2xl font-extrabold">نظرات</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          جست‌وجو، فیلتر و بررسی نظرات خوانندگان از یک جدول.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="همه نظرات"
          value={rows.length}
          loading={comments.isLoading}
          icon={MessageSquare}
        />
        <StatCard
          label="در انتظار بررسی"
          value={pendingCount}
          loading={comments.isLoading}
          icon={Clock3}
          tone={pendingCount > 0 ? "alert" : "default"}
        />
        <StatCard
          label="تأییدشده"
          value={approvedCount}
          loading={comments.isLoading}
          icon={CheckCircle2}
        />
      </div>

      <section className="space-y-4 p-4 card-elevated sm:p-5">
        <DataTable
          columns={columns}
          data={filteredRows}
          searchKey="search"
          searchPlaceholder="جست‌وجو در مقاله، نویسنده یا متن نظر…"
          loading={comments.isLoading}
          emptyLabel={rows.length === 0 ? "نظری ثبت نشده است." : "با این فیلتر نتیجه‌ای پیدا نشد."}
          toolbar={
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[28rem]">
              <AppSelect
                size="sm"
                ariaLabel="فیلتر وضعیت"
                value={statusFilter}
                onValueChange={(value) => {
                  if (isCommentStatusFilter(value)) setStatusFilter(value);
                }}
                options={statusOptions}
              />
              <AppSelect
                size="sm"
                ariaLabel="فیلتر نوع نظر"
                value={typeFilter}
                onValueChange={(value) => {
                  if (isCommentTypeFilter(value)) setTypeFilter(value);
                }}
                options={typeOptions}
              />
            </div>
          }
        />
      </section>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title="حذف نظر"
        itemName={pendingDelete?.author}
        description="این نظر برای همیشه حذف می‌شود و دیگر قابل بازیابی نیست."
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
  icon: typeof MessageSquare;
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
