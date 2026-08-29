import { ChevronRight } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarCollapseToggle() {
  const { toggleSidebar, state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const collapsed = isMobile ? !openMobile : state === "collapsed";

  return (
    <button
      type="button"
      onClick={() => (isMobile ? setOpenMobile(!openMobile) : toggleSidebar())}
      aria-label={collapsed ? "باز کردن منوی مدیریت" : "بستن منوی مدیریت"}
      className={cn(
        "fixed z-40 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background transition-[right] duration-200",
        "top-[calc(var(--app-header-height)+1.15rem)]",
        isMobile
          ? "end-3"
          : cn(
              "translate-x-1/2",
              collapsed ? "right-[var(--sidebar-width-icon)]" : "right-[var(--sidebar-width)]",
            ),
      )}
    >
      <ChevronRight
        className={cn("size-3.5 transition-transform duration-200", collapsed && "rotate-180")}
      />
    </button>
  );
}
