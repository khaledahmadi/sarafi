import assert from "node:assert/strict";
import { test } from "node:test";
import { whatsappDigits, whatsappHref } from "./whatsapp.ts";

test("whatsappDigits keeps only numbers", () => {
  assert.equal(whatsappDigits("+93 70 000 0000"), "93700000000");
});

test("whatsappHref builds a wa.me link with optional text", () => {
  const href = whatsappHref("+93700000000", "سلام");
  assert.ok(href?.startsWith("https://wa.me/93700000000"));
  assert.ok(href?.includes("text="));
});

test("whatsappHref rejects a short number", () => {
  assert.equal(whatsappHref("123"), null);
});
