import assert from "node:assert/strict";
import { test } from "node:test";
import { articleSchema, commentSchema } from "./validation.ts";

const baseArticle = {
  slug: "havale-yuan",
  title_fa: "راهنمای حواله یوان",
  excerpt_fa: "در این مقاله نحوه ارسال حواله یوان به چین را می‌خوانید.",
  body_fa: "<p>متن مقاله</p>",
  is_published: true,
};

test("articleSchema accepts uploaded cover paths", () => {
  const parsed = articleSchema.safeParse({
    ...baseArticle,
    cover_url: "/uploads/editor/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg",
  });
  assert.equal(parsed.success, true);
});

test("articleSchema allows an empty cover", () => {
  const parsed = articleSchema.safeParse({
    ...baseArticle,
    cover_url: "",
  });
  assert.equal(parsed.success, true);
});

test("commentSchema requires guest fields when logged out", () => {
  const parsed = commentSchema(false).safeParse({
    body: "نظر خوب",
    guest_name: "",
    guest_email: "",
  });
  assert.equal(parsed.success, false);
});

test("commentSchema allows logged-in comments without guest fields", () => {
  const parsed = commentSchema(true).safeParse({ body: "نظر ثبت‌شده" });
  assert.equal(parsed.success, true);
});

test("articleSchema rejects invalid cover urls", () => {
  const parsed = articleSchema.safeParse({
    ...baseArticle,
    cover_url: "javascript:alert(1)",
  });
  assert.equal(parsed.success, false);
});
