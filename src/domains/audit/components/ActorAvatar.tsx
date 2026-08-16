import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ActorAvatarProps {
  username: string;
  size?: "sm" | "md";
  className?: string;
}

const sizes = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-xs",
} as const;

/** Initials chip for the actor who triggered an audit event. */
export function ActorAvatar({
  username,
  size = "sm",
  className,
}: ActorAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-sky-500/20 font-semibold text-primary ring-1 ring-primary/10",
        sizes[size],
        className,
      )}
    >
      {initials(username)}
    </span>
  );
}
