import { Spinner } from "@/components/ui/spinner";

interface RouteLoaderProps {
  label?: string;
}

/** Full-page loader shown while the session or a lazy route resolves. */
export function RouteLoader({ label = "Loading" }: RouteLoaderProps) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-neutral-50">
      <Spinner className="size-6 text-primary" label={label} />
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}
