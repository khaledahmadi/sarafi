import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useRoles } from "@/hooks/use-session";
import { site } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `داشبورد | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
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
