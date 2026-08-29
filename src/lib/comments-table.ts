export type AdminComment = {
  id: string;
  article_title: string;
  author: string;
  body: string;
  is_approved: boolean;
  is_reply: boolean;
  created_at: string;
};

export type CommentStatusFilter = "all" | "pending" | "approved";
export type CommentTypeFilter = "all" | "comment" | "reply";

const statusFilters = ["all", "pending", "approved"] as const;
const typeFilters = ["all", "comment", "reply"] as const;

export function isCommentStatusFilter(value: string): value is CommentStatusFilter {
  return (statusFilters as readonly string[]).includes(value);
}

export function isCommentTypeFilter(value: string): value is CommentTypeFilter {
  return (typeFilters as readonly string[]).includes(value);
}

export function filterComments(
  rows: AdminComment[],
  status: CommentStatusFilter,
  type: CommentTypeFilter,
): AdminComment[] {
  return rows.filter((row) => {
    if (status === "pending" && row.is_approved) return false;
    if (status === "approved" && !row.is_approved) return false;
    if (type === "comment" && row.is_reply) return false;
    if (type === "reply" && !row.is_reply) return false;
    return true;
  });
}
