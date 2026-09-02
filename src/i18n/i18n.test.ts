import assert from "node:assert/strict";
import { test } from "node:test";
import { pickLocalized } from "./content.ts";
import { localeDir, resolveLocale } from "./config.ts";

test("resolves supported locales and falls back to fa", () => {
  assert.equal(resolveLocale("en"), "en");
  assert.equal(resolveLocale("ps"), "ps");
  assert.equal(resolveLocale("xx"), "fa");
});

test("uses rtl for fa/ps and ltr for en", () => {
  assert.equal(localeDir("fa"), "rtl");
  assert.equal(localeDir("ps"), "rtl");
  assert.equal(localeDir("en"), "ltr");
});

test("picks localized content with fa fallback", () => {
  const row = {
    title_fa: "عنوان فارسی",
    title_en: "English title",
    title_ps: null as string | null,
  };
  assert.equal(pickLocalized(row, "title", "en"), "English title");
  assert.equal(pickLocalized(row, "title", "ps"), "عنوان فارسی");
  assert.equal(pickLocalized(row, "title", "fa"), "عنوان فارسی");
});
