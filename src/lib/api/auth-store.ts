type AuthListener = () => void;

export type AuthUser = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  roles: string[];
};

type AuthSnapshot = {
  user: AuthUser | null;
  accessToken: string | null;
  expiresAt: number | null;
  ready: boolean;
};

const ACCESS_TOKEN_TTL_SECONDS = Number(import.meta.env?.["VITE_ACCESS_TOKEN_MINUTES"] ?? 15) * 60;

const USER_CACHE_KEY = "sarafi.user_cache";

const emptySnapshot: AuthSnapshot = {
  user: null,
  accessToken: null,
  expiresAt: null,
  ready: false,
};

function readStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  const parsed = JSON.parse(raw) as AuthUser;
  if (!parsed?.id || !Array.isArray(parsed.roles)) return null;
  return {
    id: String(parsed.id),
    email: parsed.email,
    full_name: parsed.full_name ?? null,
    phone: parsed.phone ?? null,
    roles: parsed.roles,
  };
}

function readUserCache(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      readStoredUser(sessionStorage.getItem(USER_CACHE_KEY)) ??
      readStoredUser(localStorage.getItem(USER_CACHE_KEY))
    );
  } catch {
    return null;
  }
}

function persistUserCache(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      sessionStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
      return;
    }
    const raw = JSON.stringify(user);
    sessionStorage.setItem(USER_CACHE_KEY, raw);
    localStorage.setItem(USER_CACHE_KEY, raw);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export type AuthNavState = "user" | "pending" | "guest";

/** Navbar must not show «ورود» while the session is still being restored. */
export function resolveAuthNavState(user: AuthUser | null, ready: boolean): AuthNavState {
  if (user) return "user";
  if (!ready) return "pending";
  return "guest";
}

let snapshot: AuthSnapshot = emptySnapshot;
let reactHydrated = false;

const listeners = new Set<AuthListener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getAuthSnapshot(): AuthSnapshot {
  return snapshot;
}

/** Same empty snapshot on the server and during the first client paint. */
export function getRenderAuthSnapshot(): AuthSnapshot {
  return reactHydrated ? snapshot : emptySnapshot;
}

export function getServerAuthSnapshot(): AuthSnapshot {
  return emptySnapshot;
}

/** Apply the sessionStorage user without waiting for a network refresh. */
export function hydrateUserCacheNow(): AuthUser | null {
  if (snapshot.user) return snapshot.user;
  const user = readUserCache();
  if (!user) return null;
  snapshot = {
    user,
    accessToken: snapshot.accessToken,
    expiresAt: snapshot.expiresAt,
    ready: false,
  };
  emit();
  return user;
}

/** Call from a useEffect so sessionStorage is not read during hydration. */
export function markReactHydrated() {
  if (reactHydrated) return;
  reactHydrated = true;
  hydrateUserCacheNow();
  emit();
}

export function getAccessToken(): string | null {
  return snapshot.accessToken;
}

export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAuthReady(ready: boolean) {
  snapshot = { ...snapshot, ready };
  emit();
}

export function setAuthSession(
  user: AuthUser | null,
  options?: { accessToken?: string | null; expiresAt?: number | null },
) {
  persistUserCache(user);
  snapshot = {
    user,
    accessToken: user == null ? null : (options?.accessToken ?? snapshot.accessToken),
    expiresAt:
      user == null
        ? null
        : (options?.expiresAt ?? Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS),
    ready: true,
  };
  emit();
}

export function clearAuthSession() {
  persistUserCache(null);
  snapshot = { user: null, accessToken: null, expiresAt: null, ready: true };
  emit();
}

export function bumpAuthExpiry(secondsFromNow = ACCESS_TOKEN_TTL_SECONDS) {
  if (!snapshot.user) return;
  snapshot = {
    ...snapshot,
    expiresAt: Math.floor(Date.now() / 1000) + secondsFromNow,
  };
  emit();
}
