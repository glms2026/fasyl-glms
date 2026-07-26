import type { Activity } from "./activity.data";
import { ActivityIcon } from "./ActivityIcon";

interface Props {
  activity: Activity;
  isLast?: boolean;
}

export function ActivityItem({ activity, isLast = false }: Props) {
  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div className="absolute left-5 top-10 h-full w-px bg-neutral-200" />
      )}

      <ActivityIcon type={activity.type} />

      <div className="flex-1 pb-8">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{activity.title}</h4>

          <span className="text-xs text-neutral-500">{activity.timestamp}</span>
        </div>

        <p className="mt-1 text-sm leading-6 text-neutral-500">
          {activity.description}
        </p>
      </div>
    </div>
  );
}
