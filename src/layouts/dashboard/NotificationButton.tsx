import { Bell } from "lucide-react";

export function NotificationButton() {
  return (
    <button className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-neutral-100">
      <Bell size={20} />

      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
    </button>
  );
}
