import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardHome } from "@/components/site/DashboardHome";
import { useRoles, useSession } from "@/hooks/use-session";
import { getAdminStats, listAdminRecentTransfers } from "@/lib/portal.functions";
import { useLocale } from "@/i18n";
import { pageMeta, resolvePageLocale } from "@/i18n/meta";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  loader: async () => ({ locale: await resolvePageLocale() }),
  head: ({ loaderData }) => {
    const base = pageMeta(loaderData?.locale ?? "fa", "meta.dashboardTitle");
    return {
      ...base,
      meta: [...base.meta, { name: "robots", content: "noindex" }],
    };
  },
  component: ManageHome,
});

function ManageHome() {
  const { isAdmin, isStaff } = useRoles();
  const { user, ready } = useSession();
  const { t } = useLocale();

  const stats = useQuery({
    queryKey: ["manage-stats"],
    queryFn: getAdminStats,
    enabled: ready && isStaff,
  });

  const recent = useQuery({
    queryKey: ["manage-recent-transfers"],
    queryFn: listAdminRecentTransfers,
    enabled: ready && isStaff,
  });

  return (
    <DashboardHome
      displayName={user?.full_name?.trim() || user?.email || t("dashboard.roleStaff")}
      isAdmin={isAdmin}
      {...(stats.data ? { stats: stats.data } : {})}
      statsLoading={stats.isLoading}
      {...(recent.data ? { recent: recent.data } : {})}
      recentLoading={recent.isLoading}
    />
  );
}
