import fasylogo from "@/domains/dashboard/assests/FasylLogo.svg";
import { useSidebarStore } from "@/layouts/store/useSidebarStore";

interface SidebarHeaderProps {
  organization: string;
  subtitle: string;
  actionLabel: string;
}

export function SidebarHeader({
  organization,
  subtitle,
  actionLabel,
}: SidebarHeaderProps) {
  const collapsed = useSidebarStore((state) => state.collapsed);
  return (
    <div className="space-y-6 border-b border-neutral-200 px-6 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg  text-white">
          <img src={fasylogo} alt="Company Logo" />
        </div>

        <div className={`${collapsed ? "hidden" : "block"}`}>
          <h2 className="text-2xl font-bold text-white">{organization}</h2>

          <p className="text-sm  text-gray-200">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
