import { Bolt } from "lucide-react";

import { quickActions } from "./quick-action.data";
import { QuickActionCard } from "./QuickActionCard";

export function QuickActions() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#001A42]/10">
          <Bolt className="text-[#001A42]" size={22} />
        </div>

        <div>
          <h2 className="text-lg font-semibold">Quick Actions</h2>

          <p className="text-sm text-neutral-500">Frequently used operations</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {quickActions.map((action) => (
          <QuickActionCard key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}
