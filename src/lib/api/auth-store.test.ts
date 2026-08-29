import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getRenderAuthSnapshot,
  getServerAuthSnapshot,
  markReactHydrated,
  resolveAuthNavState,
  setAuthSession,
} from "./auth-store.ts";

test("render snapshot stays empty until React has hydrated", () => {
  const user = {
    id: "1",
    email: "admin@sarafi.local",
    full_name: "Admin",
    phone: null,
    roles: ["admin"],
  };

  setAuthSession(user);
  assert.equal(getRenderAuthSnapshot().user, null);
  assert.equal(getServerAuthSnapshot().user, null);

  markReactHydrated();
  assert.equal(getRenderAuthSnapshot().user?.email, "admin@sarafi.local");
});

test("navbar stays pending until the session is ready", () => {
  assert.equal(resolveAuthNavState(null, false), "pending");
  assert.equal(resolveAuthNavState(null, true), "guest");
  assert.equal(
    resolveAuthNavState(
      { id: "1", email: "admin@sarafi.local", full_name: null, phone: null, roles: ["admin"] },
      false,
    ),
    "user",
  );
});
