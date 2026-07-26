import type { ReactNode } from "react";

interface DashboardContentProps {
  children: ReactNode;
}

export function DashboardContent({ children }: DashboardContentProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-neutral-50">
      <div className="min-h-full p-8">{children}</div>
    </main>
  );
}
