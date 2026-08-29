import assert from "node:assert/strict";
import { test } from "node:test";
import { filterFeedbacks, paginateFeedbacks, type FeedbackRow } from "./feedback-table.ts";

const rows: FeedbackRow[] = [
  {
    id: "1",
    author: "علی",
    body: "عالی بود",
    rating: 5,
    status: "pending",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "2",
    author: "سارا",
    body: "پاسخگو بودند",
    rating: 4,
    status: "reviewed",
    created_at: "2026-08-02T00:00:00Z",
  },
];

test("filterFeedbacks keeps every row by default", () => {
  assert.equal(filterFeedbacks(rows, "all").length, 2);
});

test("filterFeedbacks can isolate pending rows", () => {
  assert.deepEqual(
    filterFeedbacks(rows, "pending").map((row) => row.id),
    ["1"],
  );
});

test("paginateFeedbacks slices the current page", () => {
  const extra: FeedbackRow[] = [
    ...rows,
    { ...rows[0], id: "3" },
    { ...rows[0], id: "4" },
  ];
  const page = paginateFeedbacks(extra, 2, 3);
  assert.deepEqual(
    page.items.map((row) => row.id),
    ["4"],
  );
  assert.equal(page.currentPage, 2);
  assert.equal(page.totalPages, 2);
  assert.equal(page.total, 4);
});

test("paginateFeedbacks clamps an out-of-range page", () => {
  const page = paginateFeedbacks(rows, 9, 2);
  assert.equal(page.currentPage, 1);
  assert.equal(page.items.length, 2);
});
