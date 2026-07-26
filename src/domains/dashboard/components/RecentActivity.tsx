import { History } from "lucide-react";

import { activities } from "./activity.data";
import { ActivityItem } from "./ActivityItem";

export function RecentActivity() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#001A42]/10">
          <History className="text-[#001A42]" size={22} />
        </div>

        <div>
          <h2 className="text-lg font-semibold">Recent Activity</h2>

          <p className="text-sm text-neutral-500">Latest audit events</p>
        </div>
      </div>

      <div className="mt-6">
        {activities.map((activity, index) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            isLast={index === activities.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
