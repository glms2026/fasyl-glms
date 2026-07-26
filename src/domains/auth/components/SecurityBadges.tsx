import { Shield, ShieldCheck, LockKeyhole } from "lucide-react";

export function SecurityBadges() {
  const badges = [
    {
      icon: Shield,
      label: "Security",
    },
    {
      icon: ShieldCheck,
      label: "Verified",
    },
    {
      icon: LockKeyhole,
      label: "Encrypted",
    },
  ];

  return (
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-3">
        {badges.map(({ icon: Icon, label }) => (
          <div
            key={label}
            title={label}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-neutral-700
              bg-neutral-900
              transition-all
              duration-200
              hover:border-[#C89B2B]
              hover:bg-neutral-800
            "
          >
            <Icon size={18} strokeWidth={2} className="text-neutral-200" />
          </div>
        ))}
      </div>

      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
        Encrypted Infrastructure
      </span>
    </div>
  );
}
