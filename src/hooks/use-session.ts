import { useEffect, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { bootstrapAuth, fetchRoles } from "@/lib/api/auth";
import { getRenderAuthSnapshot, getServerAuthSnapshot, subscribeAuth } from "@/lib/api/auth-store";

/**
 * Cookie-session auth (httpOnly), same approach as sarafi-platform useAuth:
 * probe session once, treat 401 as logged out, never crash the route tree.
 */
export function useSession() {
  const snapshot = useSyncExternalStore(subscribeAuth, getRenderAuthSnapshot, getServerAuthSnapshot);

  useEffect(() => {
    if (!snapshot.ready) {
      void bootstrapAuth();
    }
  }, [snapshot.ready]);

  return {
    session: snapshot.user
      ? { user: snapshot.user, expires_at: snapshot.expiresAt }
      : null,
    user: snapshot.user,
    ready: snapshot.ready,
    expiresAt: snapshot.expiresAt,
  };
}

export function useRoles() {
  const { user, ready } = useSession();
  const cachedRoles = user?.roles ?? [];
  const query = useQuery({
    queryKey: ["roles", user?.id],
    enabled: Boolean(user?.id) && cachedRoles.length === 0,
    queryFn: fetchRoles,
    retry: false,
  });

  const roles = query.data ?? cachedRoles;
  return {
    roles,
    isStaff: roles.includes("admin") || roles.includes("staff"),
    isAdmin: roles.includes("admin"),
    loading: !user && !ready,
    ready,
  };
}
