import { ChevronRight } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useLocale } from "@/i18n";
import { cn } from "@/lib/utils";

export function SidebarCollapseToggle() {
  const { toggleSidebar, state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const { t, dir } = useLocale();
  const collapsed = isMobile ? !openMobile : state === "collapsed";
  const isRtl = dir === "rtl";

  return (
    <button
      type="button"
      onClick={() => (isMobile ? setOpenMobile(!openMobile) : toggleSidebar())}
      aria-label={collapsed ? t("common.openManageMenu") : t("common.closeManageMenu")}
      className={cn(
        "fixed z-40 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background transition-[left,right] duration-200",
        "top-[calc(var(--app-header-height)+0.75rem)]",
        isMobile
          ? "start-3"
          : isRtl
            ? cn(
                "translate-x-1/2",
                collapsed ? "right-[var(--sidebar-width-icon)]" : "right-[var(--sidebar-width)]",
              )
            : cn(
                "-translate-x-1/2",
                collapsed ? "left-[var(--sidebar-width-icon)]" : "left-[var(--sidebar-width)]",
              ),
      )}
    >
      <ChevronRight
        className={cn(
          "size-3.5 transition-transform duration-200",
          // RTL right sidebar: point left when collapsed. LTR left sidebar: point left when expanded.
          isRtl === collapsed && "rotate-180",
        )}
      />
    </button>
  );
}
