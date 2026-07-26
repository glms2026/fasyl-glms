import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { QuickAction } from "./quick-action.data";

interface Props {
  action: QuickAction;
}

export function QuickActionCard({ action }: Props) {
  const navigate = useNavigate();

  const Icon = action.icon;

  return (
    <button
      onClick={() => navigate(action.href)}
      className="group flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 text-left transition-all duration-200 hover:border-[#001A42] hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#001A42]/10 text-[#001A42]">
          <Icon size={22} />
        </div>

        <div>
          <h3 className="font-medium">{action.title}</h3>

          <p className="text-sm text-neutral-500">{action.description}</p>
        </div>
      </div>

      <ArrowRight
        size={18}
        className="transition-transform group-hover:translate-x-1"
      />
    </button>
  );
}
