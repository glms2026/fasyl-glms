import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <Compass className="size-6 text-primary" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
          404
        </p>

        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          That page isn't here
        </h1>

        <p className="max-w-sm text-sm text-neutral-500">
          The link may be out of date, or the screen may have moved. Head back
          to the dashboard to carry on.
        </p>
      </div>

      <Link
        to="/dashboard"
        className={cn(buttonVariants({ size: "lg" }), "px-4")}
      >
        Go to dashboard
      </Link>
    </div>
  );
}
