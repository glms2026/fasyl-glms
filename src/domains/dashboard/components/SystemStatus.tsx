import { Activity } from "lucide-react";

import { systemServices } from "./system-status.data";
import { StatusCard } from "./StatusCard";

export function SystemStatus() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      {/* Header */}

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#001A42]/10">
          <Activity className="text-[#001A42]" size={22} />
        </div>

        <div>
          <h2 className="text-lg font-semibold">System Status</h2>

          <p className="text-sm text-neutral-500">Live infrastructure health</p>
        </div>
      </div>

      {/* Services */}

      <div className="mt-6 space-y-3">
        {systemServices.map((service) => (
          <StatusCard key={service.id} service={service} />
        ))}
      </div>

      {/* Footer */}

      <div className="mt-6 border-t border-neutral-100 pt-4 text-sm text-neutral-500">
        Last checked: Just now
      </div>
    </div>
  );
}
