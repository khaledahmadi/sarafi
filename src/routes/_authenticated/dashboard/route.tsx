import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useRoles } from "@/hooks/use-session";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  loader: async () => ({ locale: await resolvePageLocale() }),
  head: ({ loaderData }) => {
    const base = pageMeta(loaderData?.locale ?? "fa", "meta.dashboardTitle");
    return {
      ...base,
      meta: [...base.meta, { name: "robots", content: "noindex" }],
    };
  },
  pendingMs: 0,
  component: ManageLayout,
});

function ManageLayout() {
  const { isStaff, loading } = useRoles();

  if (!loading && !isStaff) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
