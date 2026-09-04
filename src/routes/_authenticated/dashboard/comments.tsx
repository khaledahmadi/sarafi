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
import { useLocale } from "@/i18n";
import { resolveValidationMessage } from "@/lib/validation";
import {
  filterComments,
  isCommentStatusFilter,
  isCommentTypeFilter,
  type AdminComment,
  type CommentStatusFilter,
  type CommentTypeFilter,
} from "@/lib/comments-table";
import { approveComment, deleteComment, listAdminComments } from "@/lib/portal.functions";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/comments")({
  head: () => ({
    meta: [
      { title: `Comments | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CommentsAdminPage,
});

function CommentsAdminPage() {
  const { isStaff } = useRoles();
  const { t, d, n } = useLocale();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<AdminComment | null>(null);
  const [statusFilter, setStatusFilter] = useState<CommentStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<CommentTypeFilter>("all");

  const statusOptions: Array<{ value: CommentStatusFilter; label: string }> = useMemo(
    () => [
      { value: "all", label: t("admin.allStatuses") },
      { value: "pending", label: t("admin.pendingShort") },
      { value: "approved", label: t("admin.approved") },
    ],
    [t],
  );

  const typeOptions: Array<{ value: CommentTypeFilter; label: string }> = useMemo(
    () => [
      { value: "all", label: t("admin.allTypes") },
      { value: "comment", label: t("admin.commentType") },
      { value: "reply", label: t("admin.replyType") },
    ],
    [t],
  );

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
        toast.error(resolveValidationMessage(result.message ?? "validation.operationFailed", t));
        return;
      }
      toast.success(t("admin.commentApproved"));
      invalidate();
    },
    onError: () => toast.error(t("admin.commentApproveFailed")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteComment({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(resolveValidationMessage(result.message ?? "validation.operationFailed", t));
        return;
      }
      toast.success(t("admin.commentDeleted"));
      invalidate();
    },
    onError: () => toast.error(t("admin.commentDeleteFailed")),
  });

  const rows = useMemo(() => comments.data ?? [], [comments.data]);
  const pendingCount = rows.filter((row) => !row.is_approved).length;
  const approvedCount = rows.length - pendingCount;
  const filteredRows = useMemo(
    () => filterComments(rows, statusFilter, typeFilter),
    [rows, statusFilter, typeFilter],
  );

  const columns = useMemo(
    () =>
      createCommentsColumns({
        t,
        d,
        onApprove: (row) => approve.mutate(row.id),
        onDelete: setPendingDelete,
        approvingId: approve.isPending ? approve.variables : null,
      }),
    [t, d, approve],
  );

  if (!isStaff) {
    return (
      <div className="p-6 card-elevated">
        <h1 className="text-lg font-bold">{t("admin.accessDeniedTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("admin.commentsAccess")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">{t("admin.commentsTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("admin.commentsSubtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("admin.commentsAll")}
          value={rows.length}
          loading={comments.isLoading}
          icon={MessageSquare}
          n={n}
        />
        <StatCard
          label={t("admin.commentsPending")}
          value={pendingCount}
          loading={comments.isLoading}
          icon={Clock3}
          tone={pendingCount > 0 ? "alert" : "default"}
          n={n}
        />
        <StatCard
          label={t("admin.commentsApproved")}
          value={approvedCount}
          loading={comments.isLoading}
          icon={CheckCircle2}
          n={n}
        />
      </div>

      <section className="space-y-4 p-4 card-elevated sm:p-5">
        <DataTable
          columns={columns}
          data={filteredRows}
          searchKey="search"
          searchPlaceholder={t("admin.commentsSearchPh")}
          loading={comments.isLoading}
          emptyLabel={rows.length === 0 ? t("admin.commentsEmpty") : t("admin.noResultsFilter")}
          toolbar={
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[28rem]">
              <AppSelect
                size="sm"
                ariaLabel={t("admin.statusFilter")}
                value={statusFilter}
                onValueChange={(value) => {
                  if (isCommentStatusFilter(value)) setStatusFilter(value);
                }}
                options={statusOptions}
              />
              <AppSelect
                size="sm"
                ariaLabel={t("admin.typeFilter")}
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
        title={t("admin.commentDeleteTitle")}
        itemName={pendingDelete?.author}
        description={t("admin.commentDeleteDesc")}
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
  icon: typeof MessageSquare;
  tone?: "default" | "alert";
  n: (value: number, digits?: number) => string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-3 card-elevated",
        tone === "alert" && "border-warning/50 bg-[var(--soft-warning-bg)]",
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
          "size-8 rounded-lg",
          tone === "alert" ? "soft-badge-warning" : "icon-badge",
        )}
      >
        <Icon className="size-3.5" />
      </span>
    </div>
  );
}
