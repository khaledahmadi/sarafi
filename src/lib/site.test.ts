import assert from "node:assert/strict";
import { test } from "node:test";
import { faNum } from "./site.ts";

test("faNum is deterministic and uses Persian digits", () => {
  assert.equal(faNum(1234.5, 2), "۱٬۲۳۴٫۵۰");
  assert.equal(faNum(3, 0), "۳");
});
