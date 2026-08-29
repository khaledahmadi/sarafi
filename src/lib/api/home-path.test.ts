import assert from "node:assert/strict";
import { test } from "node:test";
import { homePathForUser } from "./home-path.ts";

function user(roles: string[]) {
  return { id: "1", email: "a@b.c", full_name: null, phone: null, roles };
}

test("staff and admin land on dashboard", () => {
  assert.equal(homePathForUser(user(["staff"])), "/dashboard");
  assert.equal(homePathForUser(user(["admin"])), "/dashboard");
});

test("customers have no user panel and go home", () => {
  assert.equal(homePathForUser(user(["customer"])), "/");
  assert.equal(homePathForUser(user([])), "/");
});
