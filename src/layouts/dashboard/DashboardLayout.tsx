import type { ReactNode } from "react";

import { DashboardContent } from "./DashboardContent";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavBar";

import type { NavigationItem } from "./layout.types";

interface DashboardLayoutProps {
  children: ReactNode;

  sidebar: {
    organization: string;
    subtitle: string;
    actionLabel: string;
    navigation: NavigationItem[];
  };
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar
        organization={sidebar.organization}
        subtitle={sidebar.subtitle}
        actionLabel={sidebar.actionLabel}
        navigation={sidebar.navigation}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar />

        <DashboardContent>{children}</DashboardContent>
      </div>
    </div>
  );
}
