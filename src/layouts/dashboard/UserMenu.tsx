import { Settings } from "lucide-react";

export function UserMenu() {
  return (
    <div className="flex items-center gap-2">
      <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-neutral-100">
        <Settings size={20} />
      </button>

      <button className="overflow-hidden rounded-full">
        <img
          src="/avatar.jpg"
          alt="Profile"
          className="h-10 w-10 rounded-full object-cover"
        />
      </button>
    </div>
  );
}
