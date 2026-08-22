import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

const tabs = [
  { label: "Overview", href: "/gl", end: true },
  { label: "All entries", href: "/gl/entries", end: false },
  { label: "Create GL", href: "/gl/create", end: false },
];

/** Sub-navigation for the General Ledger module. */
export function GlTabs() {
  return (
    <nav
      aria-label="General Ledger sections"
      className="flex gap-1 border-b border-neutral-200"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.href}
          to={tab.href}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              "relative -mb-px px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-neutral-500 hover:text-neutral-800",
            )
          }
        >
          {({ isActive }) => (
            <>
              {tab.label}

              {isActive && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
