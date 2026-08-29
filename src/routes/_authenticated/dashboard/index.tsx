import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardHome } from "@/components/site/DashboardHome";
import { useRoles, useSession } from "@/hooks/use-session";
import { getAdminStats, listAdminRecentTransfers } from "@/lib/portal.functions";
import { site } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: `داشبورد | ${site.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManageHome,
});

function ManageHome() {
  const { isAdmin } = useRoles();
  const { user } = useSession();

  const stats = useQuery({
    queryKey: ["manage-stats"],
    queryFn: getAdminStats,
  });

  const recent = useQuery({
    queryKey: ["manage-recent-transfers"],
    queryFn: listAdminRecentTransfers,
  });

  return (
    <DashboardHome
      displayName={user?.full_name?.trim() || user?.email || "کارشناس"}
      isAdmin={isAdmin}
      stats={stats.data}
      statsLoading={stats.isLoading}
      recent={recent.data}
      recentLoading={recent.isLoading}
    />
  );
}
