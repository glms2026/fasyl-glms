import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface SidebarProps {
  organization: string;
  subtitle: string;
  actionLabel: string;

  navigation: NavigationItem[];
}

export interface TopNavigationItem {
  title: string;
  href: string;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;

  organization: string;
  subtitle: string;
  actionLabel: string;

  sidebarNavigation: NavigationItem[];
  topNavigation: TopNavigationItem[];
}
