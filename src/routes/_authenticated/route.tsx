import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { bootstrapAuth } from "@/lib/api/auth";
import { getAuthSnapshot, hydrateUserCacheNow } from "@/lib/api/auth-store";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingMs: 0,
  beforeLoad: async () => {
    const cached = hydrateUserCacheNow();
    if (cached) {
      void bootstrapAuth();
      return { user: cached };
    }
    await bootstrapAuth();
    const snap = getAuthSnapshot();
    if (!snap.user) throw redirect({ to: "/auth" });
    return { user: snap.user };
  },
  component: () => <Outlet />,
});
