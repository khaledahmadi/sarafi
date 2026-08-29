import assert from "node:assert/strict";
import { test } from "node:test";
import { countryNameOptionsForIsoCodes, findCountryByNameFa } from "./country-flags.ts";

test("destination countries are limited to the given currency countries", () => {
  const options = countryNameOptionsForIsoCodes(["CN", "AF"], "چین");
  const values = options.map((option) => option.value);
  assert.deepEqual(values.sort(), ["افغانستان", "چین"].sort());
  assert.equal(findCountryByNameFa("چین")?.code, "CN");
});
