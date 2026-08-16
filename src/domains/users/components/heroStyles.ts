import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/** White button style that reads well on the navy gradient hero. */
export const heroButtonClass = cn(
  buttonVariants({ size: "lg" }),
  "border-transparent bg-white text-primary shadow-sm transition-all hover:bg-white/90 hover:text-primary hover:shadow-md",
);

/** Frosted-glass button style for secondary actions on the gradient hero. */
export const heroGhostButtonClass = cn(
  buttonVariants({ size: "lg", variant: "outline" }),
  "border-white/25 bg-white/5 text-white shadow-sm backdrop-blur transition-all hover:border-white/40 hover:bg-white/10 hover:text-white",
);
