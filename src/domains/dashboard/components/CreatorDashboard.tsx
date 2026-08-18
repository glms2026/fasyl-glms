import { Link } from "react-router-dom";
import {
  FileText,
  KeyRound,
  Plus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { cn } from "@/lib/utils";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function CreatorDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header with emerald accent */}
      <PageHeader
        title={`${greeting()}, ${user?.username ?? "there"}`}
        description="GL workspace — manage ledger accounts"
        eyebrow={<Badge className="bg-emerald-100 text-emerald-700">Creator</Badge>}
        actions={
          <Link
            to="/create-gl"
            className={cn(buttonVariants({ size: "lg" }), "px-4")}
          >
            <Plus className="size-4" />
            Create GL account
          </Link>
        }
      />

      {/* Metrics row — placeholder cards */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="GL Accounts"
          value="—"
          icon={FileText}
          caption="Coming soon"
        />
        <MetricCard
          label="Journal Entries"
          value="—"
          icon={FileText}
          caption="Coming soon"
        />
        <MetricCard
          label="Total Assets"
          value="—"
          icon={FileText}
          caption="Coming soon"
        />
        <MetricCard
          label="Pending GL Approvals"
          value="—"
          icon={FileText}
          caption="Coming soon"
        />
      </section>

      {/* Main content — placeholder for ledger data */}
      <SectionCard
        title="Ledger Overview"
        description="GL account data will appear here once the GL API is available"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
            <FileText className="size-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Ledger data coming soon
          </h3>
          <p className="text-sm text-neutral-500 max-w-md">
            The GL API endpoints are being finalized. Once available, this dashboard will display
            real-time ledger accounts, journal entries, and balances.
          </p>
        </div>
      </SectionCard>

      {/* Quick actions */}
      <SectionCard title="Quick Actions">
        <ul className="space-y-2">
          <li>
            <Link
              to="/create-gl"
              className="flex items-center gap-3 rounded-xl border border-emerald-200 p-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Plus className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-900">Create GL account</span>
                <span className="block truncate text-xs text-neutral-500">Add a new ledger account</span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="/change-password"
              className="flex items-center gap-3 rounded-xl border border-emerald-200 p-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <KeyRound className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-900">Change password</span>
                <span className="block truncate text-xs text-neutral-500">Update your credentials</span>
              </span>
            </Link>
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
