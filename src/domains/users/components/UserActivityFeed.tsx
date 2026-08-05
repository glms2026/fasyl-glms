import {
  Lock,
  LogIn,
  PauseCircle,
  PlayCircle,
  SquarePen,
  UserPlus,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatRelative } from "@/lib/format";

import type { UserActivity } from "../types";

interface UserActivityFeedProps {
  activities: UserActivity[] | undefined;
  isLoading?: boolean;
}

const icons = {
  created: { Icon: UserPlus, tone: "bg-emerald-50 text-emerald-600" },
  updated: { Icon: SquarePen, tone: "bg-sky-50 text-sky-600" },
  locked: { Icon: Lock, tone: "bg-red-50 text-red-600" },
  suspended: { Icon: PauseCircle, tone: "bg-amber-50 text-amber-600" },
  activated: { Icon: PlayCircle, tone: "bg-emerald-50 text-emerald-600" },
  login: { Icon: LogIn, tone: "bg-neutral-100 text-neutral-600" },
} as const;

export function UserActivityFeed({
  activities,
  isLoading = false,
}: UserActivityFeedProps) {
  if (isLoading) {
    return (
      <ul className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <li key={index} className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />

            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (!activities?.length) {
    return (
      <EmptyState
        title="No recent activity"
        description="Account changes will appear here as your team makes them."
      />
    );
  }

  return (
    <ul className="space-y-1">
      {activities.map((activity) => {
        const { Icon, tone } = icons[activity.kind] ?? icons.updated;

        return (
          <li
            key={activity.id}
            className="flex items-start gap-3 rounded-lg px-1 py-2.5"
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full ${tone}`}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-neutral-700">
                <span className="font-medium text-neutral-900">
                  {activity.actor}
                </span>{" "}
                {activity.action}{" "}
                <span className="font-medium text-neutral-900">
                  {activity.target}
                </span>
              </p>

              <p className="text-xs text-neutral-400">
                {formatRelative(activity.timestamp)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
