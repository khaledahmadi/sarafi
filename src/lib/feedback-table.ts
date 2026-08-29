export const feedbackStatuses = ["pending", "reviewed"] as const;

export type FeedbackStatus = (typeof feedbackStatuses)[number];
export type FeedbackStatusFilter = "all" | FeedbackStatus;

export type FeedbackRow = {
  id: string;
  author: string;
  body: string;
  rating: number;
  status: FeedbackStatus;
  created_at: string;
};

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  pending: "در انتظار بررسی",
  reviewed: "بررسی‌شده",
};

export function isFeedbackStatus(value: string): value is FeedbackStatus {
  return (feedbackStatuses as readonly string[]).includes(value);
}

export function isFeedbackStatusFilter(value: string): value is FeedbackStatusFilter {
  return value === "all" || isFeedbackStatus(value);
}

export function filterFeedbacks(rows: FeedbackRow[], status: FeedbackStatusFilter): FeedbackRow[] {
  if (status === "all") return rows;
  return rows.filter((row) => row.status === status);
}

export const PUBLIC_FEEDBACK_PAGE_SIZE = 6;

export function paginateFeedbacks<T>(
  rows: T[],
  page: number,
  pageSize = PUBLIC_FEEDBACK_PAGE_SIZE,
): { items: T[]; currentPage: number; totalPages: number; total: number } {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    currentPage,
    totalPages,
    total,
  };
}
