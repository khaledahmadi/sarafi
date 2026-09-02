import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  BadgeDollarSign,
  FileText,
  Gauge,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  CircleHelp,
  MessageSquareHeart,
  Newspaper,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRoles, useSession } from "@/hooks/use-session";
import { getAdminStats } from "@/lib/portal.functions";
import { useLocale } from "@/i18n";
import { cn } from "@/lib/utils";

type Item = {
  to: string;
  label: string;
  icon: typeof Gauge;
  adminOnly?: boolean;
};


function sidebarItemClass(isActive: boolean) {
  return cn(
    "!overflow-visible !p-0",
    "hover:!bg-transparent data-[active=true]:!bg-transparent",
    // Expanded: full row with icon + label
    "group-data-[state=expanded]:flex group-data-[state=expanded]:h-auto group-data-[state=expanded]:min-h-10 group-data-[state=expanded]:w-full",
    "group-data-[state=expanded]:flex-row group-data-[state=expanded]:flex-nowrap group-data-[state=expanded]:items-center group-data-[state=expanded]:gap-3",
    "group-data-[state=expanded]:rounded-xl group-data-[state=expanded]:border group-data-[state=expanded]:py-1 group-data-[state=expanded]:ps-1 group-data-[state=expanded]:pe-2.5",
    "group-data-[state=expanded]:transition-[box-shadow,background-color,border-color]",
    isActive
      ? cn(
          "group-data-[state=expanded]:border-sidebar-border group-data-[state=expanded]:bg-sidebar-accent group-data-[state=expanded]:font-medium",
          "group-data-[state=expanded]:shadow-[0_4px_14px_rgba(0,0,0,0.42),0_0_0_1px_rgba(255,255,255,0.08)]",
        )
      : cn(
          "group-data-[state=expanded]:border-transparent group-data-[state=expanded]:bg-transparent group-data-[state=expanded]:shadow-none",
          "group-data-[state=expanded]:hover:border-sidebar-border group-data-[state=expanded]:hover:bg-sidebar-accent",
          "group-data-[state=expanded]:hover:shadow-[0_4px_14px_rgba(0,0,0,0.42),0_0_0_1px_rgba(255,255,255,0.08)]",
        ),
    // Collapsed: icon-only card
    "group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!h-9 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!min-h-0 group-data-[collapsible=icon]:shrink-0",
    "group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center",
    "group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:border group-data-[collapsible=icon]:border-sidebar-border/80",
    "group-data-[collapsible=icon]:bg-sidebar-accent/40 group-data-[collapsible=icon]:shadow-none",
    "group-data-[collapsible=icon]:transition-[box-shadow,background-color,border-color]",
    isActive
      ? cn(
          "group-data-[collapsible=icon]:border-sidebar-primary/35 group-data-[collapsible=icon]:bg-sidebar-accent",
          "group-data-[collapsible=icon]:!shadow-[var(--shadow-sidebar-active)]",
        )
      : cn(
          "group-data-[collapsible=icon]:hover:border-sidebar-border group-data-[collapsible=icon]:hover:bg-sidebar-accent",
          "group-data-[collapsible=icon]:hover:!shadow-[var(--shadow-sidebar-hover)]",
        ),
  );
}

const sidebarLinkClass = cn(
  "group/nav flex min-w-0 items-center",
  "group-data-[state=expanded]:w-full group-data-[state=expanded]:flex-row group-data-[state=expanded]:flex-nowrap group-data-[state=expanded]:items-center group-data-[state=expanded]:gap-3",
  "group-data-[collapsible=icon]:size-full group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center",
);

const sidebarGroupClass = cn(
  "py-0 ps-4 pe-3 sm:ps-6 sm:pe-6",
  "group-data-[collapsible=icon]:!px-2.5 group-data-[collapsible=icon]:!py-1 sm:group-data-[collapsible=icon]:!px-2.5 sm:group-data-[collapsible=icon]:!py-1",
);

const sidebarMenuClass = cn(
  "gap-3",
  "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-4",
);

const sidebarIconClass = "size-5 shrink-0";

function sidebarIconTileClass(isActive: boolean) {
  return cn(
    "grid size-10 shrink-0 place-items-center rounded-xl border border-sidebar-border/80 bg-sidebar-accent/40 shadow-[var(--shadow-card)] transition-[box-shadow,background-color,border-color]",
    "group-data-[state=expanded]:group-hover/nav:border-transparent group-data-[state=expanded]:group-hover/nav:bg-transparent group-data-[state=expanded]:group-hover/nav:shadow-none",
    isActive &&
      "group-data-[state=expanded]:border-transparent group-data-[state=expanded]:bg-transparent group-data-[state=expanded]:shadow-none",
    "group-data-[collapsible=icon]:size-full group-data-[collapsible=icon]:rounded-none group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none",
  );
}

const sidebarMenuItemClass =
  "group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:overflow-visible";

export function ManageSidebar() {
  const { isAdmin, isStaff, loading } = useRoles();
  const { ready } = useSession();
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const hideAdminItems = !loading && !isAdmin;
  const { t, n, dir } = useLocale();
  const stats = useQuery({
    queryKey: ["manage-stats"],
    queryFn: getAdminStats,
    enabled: ready && isStaff,
  });
  const pendingFeedbacks = stats.data?.pending_feedbacks ?? 0;

  const items = useMemo(
    (): Item[] => [
      { to: "/dashboard", label: t("sidebar.dashboard"), icon: Gauge },
      { to: "/dashboard/transfers", label: t("sidebar.transfers"), icon: Send },
      { to: "/dashboard/rates", label: t("sidebar.rates"), icon: BadgeDollarSign },
      {
        to: "/dashboard/services",
        label: t("sidebar.services"),
        icon: Sparkles,
        adminOnly: true,
      },
      {
        to: "/dashboard/branches",
        label: t("sidebar.branches"),
        icon: MapPin,
        adminOnly: true,
      },
      { to: "/dashboard/blog", label: t("sidebar.blog"), icon: Newspaper },
      { to: "/dashboard/comments", label: t("sidebar.comments"), icon: MessageSquare },
      { to: "/dashboard/faqs", label: t("sidebar.faqs"), icon: CircleHelp },
      {
        to: "/dashboard/feedback",
        label: t("sidebar.feedback"),
        icon: MessageSquareHeart,
      },
      {
        to: "/dashboard/pages",
        label: t("sidebar.pages"),
        icon: FileText,
        adminOnly: true,
      },
      {
        to: "/dashboard/users",
        label: t("sidebar.users"),
        icon: Users,
        adminOnly: true,
      },
    ],
    [t],
  );

  const visibleItems = items.filter((item) => !item.adminOnly || !hideAdminItems);

  return (
    <Sidebar
      side={dir === "rtl" ? "right" : "left"}
      collapsible="icon"
      className="!top-[var(--app-header-height)] !h-[calc(100svh-var(--app-header-height))]"
    >
      <SidebarContent className="overflow-visible pt-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-4">
        <SidebarGroup className={cn("overflow-visible", sidebarGroupClass)}>
          <SidebarGroupContent>
            <SidebarMenu className={sidebarMenuClass}>
              {visibleItems.map((item) => {
                const badge =
                  item.to === "/dashboard/feedback" && pendingFeedbacks > 0
                    ? pendingFeedbacks
                    : 0;
                const isActive =
                  item.to === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.to;
                return (
                  <SidebarMenuItem key={item.to} className={sidebarMenuItemClass}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        sidebarItemClass(isActive),
                        badge > 0 && "group-data-[state=expanded]:!pe-3.5",
                      )}
                      tooltip={
                        badge > 0 ? `${item.label} (${n(badge, 0)})` : item.label
                      }
                      isActive={isActive}
                    >
                      <Link to={item.to} className={sidebarLinkClass}>
                        <span className={sidebarIconTileClass(isActive)} aria-hidden="true">
                          <item.icon className={sidebarIconClass} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-start group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                        {badge > 0 ? (
                          <div
                            className="ms-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full border border-warning/20 bg-warning px-1.5 text-[11px] font-bold leading-none text-warning-foreground group-data-[collapsible=icon]:hidden"
                            aria-label={t("sidebar.pendingFeedback", {
                              count: n(badge, 0),
                            })}
                          >
                            {n(badge, 0)}
                          </div>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("py-2 group-data-[collapsible=icon]:pb-3", sidebarGroupClass)}>
        <SidebarMenu className={sidebarMenuClass}>
          <SidebarMenuItem className={sidebarMenuItemClass}>
            <SidebarMenuButton
              asChild
              className={sidebarItemClass(false)}
              tooltip={t("sidebar.viewPublicSite")}
            >
              <Link to="/" className={sidebarLinkClass}>
                <span className={sidebarIconTileClass(false)} aria-hidden="true">
                  <LayoutDashboard className={sidebarIconClass} />
                </span>
                <span className="min-w-0 flex-1 truncate text-start group-data-[collapsible=icon]:hidden">
                  {t("sidebar.viewPublicSite")}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
