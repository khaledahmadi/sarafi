import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ManageSidebar } from "@/components/site/ManageSidebar";
import { SidebarCollapseToggle } from "@/components/site/SidebarCollapseToggle";

export function ManageShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="min-h-[calc(100vh-var(--app-header-height))]">
      <div className="flex min-h-[calc(100vh-var(--app-header-height))] w-full">
        <ManageSidebar />
        <SidebarCollapseToggle />
        <SidebarInset className="min-w-0 flex-1 bg-background">
          <div className="min-w-0 p-4 sm:p-6">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
