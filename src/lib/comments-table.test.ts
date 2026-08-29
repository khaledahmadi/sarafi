import assert from "node:assert/strict";
import { test } from "node:test";
import { filterComments, type AdminComment } from "./comments-table.ts";

const rows: AdminComment[] = [
  {
    id: "1",
    article_title: "حواله",
    author: "علی",
    body: "سؤال",
    is_approved: false,
    is_reply: false,
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "2",
    article_title: "حواله",
    author: "ادمین",
    body: "پاسخ",
    is_approved: true,
    is_reply: true,
    created_at: "2026-08-02T00:00:00Z",
  },
];

test("filterComments keeps every row by default", () => {
  assert.equal(filterComments(rows, "all", "all").length, 2);
});

test("filterComments can isolate pending comments", () => {
  const pending = filterComments(rows, "pending", "all");
  assert.deepEqual(
    pending.map((row) => row.id),
    ["1"],
  );
});

test("filterComments can isolate approved replies", () => {
  const replies = filterComments(rows, "approved", "reply");
  assert.deepEqual(
    replies.map((row) => row.id),
    ["2"],
  );
});
