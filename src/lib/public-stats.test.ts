import assert from "node:assert/strict";
import { test } from "node:test";
import { yearsOfExperience } from "./public-stats.ts";

test("yearsOfExperience uses the Gregorian founding year", () => {
  const now = new Date("2026-08-13T00:00:00Z");
  assert.equal(yearsOfExperience("2008", now), 18);
  assert.equal(yearsOfExperience("۲۰۱۲", now), 14);
});

test("yearsOfExperience rejects invalid years", () => {
  const now = new Date("2026-08-13T00:00:00Z");
  assert.equal(yearsOfExperience("", now), 0);
  assert.equal(yearsOfExperience("1800", now), 0);
  assert.equal(yearsOfExperience("2030", now), 0);
});
