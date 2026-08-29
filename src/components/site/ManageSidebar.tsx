import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRoles } from "@/hooks/use-session";
import { getAdminStats } from "@/lib/portal.functions";
import { faNum, site } from "@/lib/site";

type Item = {
  to: string;
  label: string;
  icon: typeof Gauge;
  adminOnly?: boolean;
};

const groups: { label: string; items: Item[] }[] = [
  {
    label: "نمای کلی",
    items: [
      { to: "/dashboard", label: "داشبورد", icon: Gauge },
      { to: "/dashboard/transfers", label: "درخواست‌های حواله", icon: Send },
    ],
  },
  {
    label: "محتوای سایت",
    items: [
      { to: "/dashboard/rates", label: "نرخ اسعار", icon: BadgeDollarSign },
      { to: "/dashboard/services", label: "خدمات", icon: Sparkles, adminOnly: true },
      { to: "/dashboard/branches", label: "نمایندگی‌ها", icon: MapPin, adminOnly: true },
      { to: "/dashboard/blog", label: "وبلاگ", icon: Newspaper },
      { to: "/dashboard/comments", label: "نظرات", icon: MessageSquare },
      { to: "/dashboard/faqs", label: "سؤالات متداول", icon: CircleHelp },
      { to: "/dashboard/feedback", label: "بازخورد مشتریان", icon: MessageSquareHeart },
      { to: "/dashboard/pages", label: "درباره ما و تماس", icon: FileText, adminOnly: true },
    ],
  },
  {
    label: "سیستم",
    items: [{ to: "/dashboard/users", label: "کاربران و نقش‌ها", icon: Users, adminOnly: true }],
  },
];

export function ManageSidebar() {
  const { isAdmin, loading } = useRoles();
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const hideAdminItems = !loading && !isAdmin;
  const stats = useQuery({
    queryKey: ["manage-stats"],
    queryFn: getAdminStats,
  });
  const pendingFeedbacks = stats.data?.pending_feedbacks ?? 0;

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      className="!top-[var(--app-header-height)] !h-[calc(100svh-var(--app-header-height))]"
    >
      <SidebarHeader className="group-data-[collapsible=icon]:h-12">
        <div className="flex items-center gap-2.5 px-1 py-2 group-data-[collapsible=icon]:hidden">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-base font-extrabold text-accent-foreground">
            س
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{site.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {isAdmin ? "دسترسی مدیر" : "دسترسی کارشناس"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => {
          const items = group.items.filter((item) => !item.adminOnly || !hideAdminItems);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const badge =
                      item.to === "/dashboard/feedback" && pendingFeedbacks > 0
                        ? pendingFeedbacks
                        : 0;
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          asChild
                          tooltip={
                            badge > 0
                              ? `${item.label} (${faNum(badge, 0)})`
                              : item.label
                          }
                          isActive={
                            item.to === "/dashboard"
                              ? pathname === "/dashboard"
                              : pathname === item.to
                          }
                        >
                          <Link to={item.to} className="flex items-center gap-2">
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                            {badge > 0 ? (
                              <span
                                className="ms-auto grid min-h-5 min-w-5 shrink-0 place-items-center rounded-full bg-warning px-1.5 text-[11px] font-bold text-warning-foreground opacity-100 group-data-[collapsible=icon]:hidden"
                                aria-label={`${faNum(badge, 0)} بازخورد در انتظار`}
                              >
                                {faNum(badge, 0)}
                              </span>
                            ) : null}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="مشاهده سایت">
              <Link to="/" className="flex items-center gap-2">
                <LayoutDashboard className="size-4" />
                <span>مشاهده سایت عمومی</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
