import type { ActionResult } from "@/lib/validation";
import { getAccessToken } from "@/lib/api/auth-store";

/**
 * Browser: same-origin relative `/api/...` via Start proxy route.
 * SSR: hit backend directly with API_URL (Compose: http://backend:8000).
 */
export function getApiBaseUrl(): string {
  const isServer = typeof window === "undefined";
  if (isServer) {
    const internal =
      (typeof process !== "undefined" && process.env["API_URL"]) || "http://localhost:8003";
    return internal.replace(/\/$/, "");
  }

  const configured = (import.meta.env["VITE_API_URL"] as string | undefined)?.trim();
  if (!configured || configured === "same-origin") {
    return "";
  }
  return configured.replace(/\/$/, "");
}

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  /** Skip one-shot 401 → refresh → retry (used by refresh itself). */
  skipAuthRetry?: boolean;
};

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFromDetail(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "detail" in detail) {
    const value = (detail as { detail: unknown }).detail;
    if (typeof value === "string") return value;
  }
  return fallback;
}

let refreshInFlight: Promise<unknown> | null = null;

async function refreshAccessTokenOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    // Dynamic import avoids a circular dependency with auth.ts
    refreshInFlight = import("@/lib/api/auth")
      .then(({ refreshSession }) => refreshSession())
      .finally(() => {
        refreshInFlight = null;
      });
  }
  const user = await refreshInFlight;
  return Boolean(user);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    credentials: "include",
    headers,
    cache: "no-store",
  };
  if (options.signal) init.signal = options.signal;
  if (options.body !== undefined) {
    init.body = isFormData ? (options.body as FormData) : JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, init);
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      0,
      error,
    );
  }

  const isAuthPath =
    path.includes("/api/v1/auth/login") ||
    path.includes("/api/v1/auth/signup") ||
    path.includes("/api/v1/auth/refresh") ||
    path.includes("/api/v1/auth/logout");

  if (
    response.status === 401 &&
    !options.skipAuthRetry &&
    !isAuthPath &&
    typeof window !== "undefined"
  ) {
    const refreshed = await refreshAccessTokenOnce();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipAuthRetry: true });
    }
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(
      messageFromDetail(payload, `Request failed (${response.status})`),
      response.status,
      payload,
    );
  }

  return payload as T;
}

export async function apiAction<T = undefined>(
  path: string,
  options: RequestOptions = {},
): Promise<ActionResult<T>> {
  try {
    const result = await apiRequest<unknown>(path, options);
    if (result && typeof result === "object" && "ok" in result) {
      return result as ActionResult<T>;
    }
    return { ok: true, data: result as T } as ActionResult<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      const detail = error.detail;
      if (detail && typeof detail === "object" && "ok" in detail) {
        return detail as ActionResult<T>;
      }
      return { ok: false, message: error.message };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "خطای ناشناخته",
    };
  }
}
