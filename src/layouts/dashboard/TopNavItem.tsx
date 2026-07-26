import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  href: string;
}

export function TopNavItem({ title, href }: Props) {
  return (
    <NavLink
      to={href}
      className={({ isActive }) =>
        cn(
          "relative flex h-full items-center px-4 text-sm font-medium transition-colors",
          isActive ? "text-black" : "text-neutral-500 hover:text-black",
        )
      }
    >
      {({ isActive }) => (
        <>
          {title}

          {isActive && (
            <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-black" />
          )}
        </>
      )}
    </NavLink>
  );
}
