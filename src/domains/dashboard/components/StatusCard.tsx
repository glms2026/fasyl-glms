import type { SystemService } from "./system-status.data";
import { StatusIndicator } from "./StatusIndicator";

interface StatusCardProps {
  service: SystemService;
}

export function StatusCard({ service }: StatusCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 transition-colors hover:bg-neutral-100">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{service.name}</h3>

          <p className="mt-1 text-sm text-neutral-500">{service.description}</p>
        </div>

        <StatusIndicator status={service.status} />
      </div>
    </div>
  );
}
