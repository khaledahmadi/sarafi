import assert from "node:assert/strict";
import { test } from "node:test";
import { filterFaqs } from "./faq-page.ts";

const faqs = [
  {
    id: "1",
    question: "کارمزد حواله چقدر است؟",
    answer: "کارمزد بسته به مقصد اعلام می‌شود.",
    keywords: "کارمزد، کمیسیون",
  },
  {
    id: "2",
    question: "چه مدارکی لازم است؟",
    answer: "مشخصات فرستنده و گیرنده کافی است.",
    keywords: null,
  },
];

test("filterFaqs returns all items when query is empty", () => {
  assert.equal(filterFaqs(faqs, "  ").length, 2);
});

test("filterFaqs matches question, answer, or keywords", () => {
  assert.equal(filterFaqs(faqs, "کمیسیون")[0]?.id, "1");
  assert.equal(filterFaqs(faqs, "فرستنده")[0]?.id, "2");
  assert.equal(filterFaqs(faqs, "مدارک")[0]?.id, "2");
});

test("filterFaqs returns empty when nothing matches", () => {
  assert.equal(filterFaqs(faqs, "پاسپورت طلایی").length, 0);
});
