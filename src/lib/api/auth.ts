import { apiRequest, ApiError } from "@/lib/api/client";
import {
  bumpAuthExpiry,
  clearAuthSession,
  getAccessToken,
  getAuthSnapshot,
  setAuthReady,
  setAuthSession,
  type AuthUser,
} from "@/lib/api/auth-store";
import { homePathForUser } from "@/lib/api/home-path";

export { homePathForUser };

const HAS_SESSION_KEY = "sarafi.has_session";

let bootstrapPromise: Promise<AuthUser | null> | null = null;

type AuthPayload = AuthUser & { access_token?: string };

function markHasSession(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    sessionStorage.setItem(HAS_SESSION_KEY, "1");
    localStorage.setItem(HAS_SESSION_KEY, "1");
  } else {
    sessionStorage.removeItem(HAS_SESSION_KEY);
    localStorage.removeItem(HAS_SESSION_KEY);
  }
}

function shouldAttemptRefresh(): boolean {
  if (typeof window === "undefined") return false;
  return (
    sessionStorage.getItem(HAS_SESSION_KEY) === "1" ||
    localStorage.getItem(HAS_SESSION_KEY) === "1"
  );
}

function asUser(payload: AuthUser): AuthUser {
  return {
    id: String(payload.id),
    email: payload.email,
    full_name: payload.full_name ?? null,
    phone: payload.phone ?? null,
    roles: payload.roles ?? [],
  };
}

function applyAuthPayload(payload: AuthPayload): AuthUser {
  const user = asUser(payload);
  setAuthSession(user, { accessToken: payload.access_token ?? null });
  markHasSession(true);
  return user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const payload = await apiRequest<AuthPayload>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return applyAuthPayload(payload);
}

export async function signup(input: {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}): Promise<
  AuthUser | { ok: false; message: string; fieldErrors?: Record<string, string> }
> {
  const result = await apiRequest<
    AuthPayload | { ok: false; message?: string; fieldErrors?: Record<string, string> }
  >("/api/v1/auth/signup", {
    method: "POST",
    body: {
      email: input.email,
      password: input.password,
      full_name: input.full_name,
      phone: input.phone,
    },
  });

  if (result && typeof result === "object" && "ok" in result && result.ok === false) {
    const failure = {
      ok: false as const,
      message: result.message ?? "ثبت‌نام انجام نشد",
      ...(result.fieldErrors ? { fieldErrors: result.fieldErrors } : {}),
    };
    return failure;
  }

  return applyAuthPayload(result as AuthPayload);
}

export async function logout(): Promise<void> {
  try {
    await apiRequest("/api/v1/auth/logout", { method: "POST" });
  } finally {
    markHasSession(false);
    clearAuthSession();
    bootstrapPromise = null;
  }
}

export async function refreshSession(): Promise<AuthUser | null> {
  try {
    const payload = await apiRequest<AuthPayload>("/api/v1/auth/refresh", { method: "POST" });
    return applyAuthPayload(payload);
  } catch (error) {
    if (!(error instanceof ApiError && (error.status === 401 || error.status === 0))) {
      console.warn("refreshSession failed", error);
    }
    markHasSession(false);
    clearAuthSession();
    return null;
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const user = asUser(await apiRequest<AuthUser>("/api/v1/auth/me"));
    setAuthSession(user);
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    if (!(error instanceof ApiError && error.status === 0)) {
      console.warn("fetchMe failed", error);
    }
    return null;
  }
}

export async function fetchSession(): Promise<AuthUser | null> {
  try {
    const data = await apiRequest<{ user: AuthUser | null }>("/api/v1/auth/session");
    if (!data.user) {
      return null;
    }
    const user = asUser(data.user);
    setAuthSession(user);
    return user;
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 0)) {
      console.warn("fetchSession failed", error);
    }
    return null;
  }
}

export async function fetchRoles(): Promise<string[]> {
  const data = await apiRequest<{ roles: string[] }>("/api/v1/auth/roles");
  return data.roles ?? [];
}

/**
 * Restore session after reload: refresh cookie → access_token in memory → Bearer.
 * Cookie-only access auth is unreliable through the Start proxy (duplicate Set-Cookie).
 */
export async function bootstrapAuth(): Promise<AuthUser | null> {
  const existing = getAuthSnapshot();
  if (existing.user && getAccessToken()) {
    if (!existing.ready) setAuthReady(true);
    return existing.user;
  }
  if (existing.ready && !existing.user) {
    return null;
  }
  if (!shouldAttemptRefresh() && !existing.user) {
    setAuthReady(true);
    return null;
  }
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = restoreSession();
  return bootstrapPromise;
}

async function restoreSession(): Promise<AuthUser | null> {
  try {
    const existing = getAuthSnapshot();
    if (existing.user && getAccessToken()) {
      setAuthReady(true);
      return existing.user;
    }

    if (shouldAttemptRefresh()) {
      const refreshed = await refreshSession();
      setAuthReady(true);
      if (refreshed) return refreshed;
    }

    const user = await fetchSession();
    if (user && getAccessToken()) {
      markHasSession(true);
      setAuthReady(true);
      return user;
    }

    // Session cookie without Bearer token cannot call protected APIs — try refresh once.
    if (user && !getAccessToken()) {
      const refreshed = await refreshSession();
      setAuthReady(true);
      return refreshed;
    }

    clearAuthSession();
    return null;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function markSessionRefreshed() {
  bumpAuthExpiry();
}
