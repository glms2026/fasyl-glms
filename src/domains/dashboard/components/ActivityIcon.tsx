import { BookOpen, ShieldCheck, UserPlus, CheckCircle2 } from "lucide-react";

import type { ActivityType } from "./activity.data";

interface Props {
  type: ActivityType;
}

export function ActivityIcon({ type }: Props) {
  switch (type) {
    case "Journal":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <BookOpen size={18} />
        </div>
      );

    case "Approval":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckCircle2 size={18} />
        </div>
      );

    case "User":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">
          <UserPlus size={18} />
        </div>
      );

    default:
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
          <ShieldCheck size={18} />
        </div>
      );
  }
}
