import {
  CheckCircle2,
  CircleSlash,
  Lock,
  PauseCircle,
  ShieldX,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/Tooltips";
import { titleCase } from "@/lib/format";

interface UserStatusBadgeProps {
  /** Raw backend status string — unknown values render as neutral. */
  status: string;
  /** Shown in a tooltip on REJECTED badges. */
  rejectionReason?: string | null;
}

const presentation: Record<
  string,
  { variant: "success" | "warning" | "destructive" | "neutral" | "info"; Icon: typeof CheckCircle2 }
> = {
  ACTIVE: { variant: "success", Icon: CheckCircle2 },
  SUSPENDED: { variant: "warning", Icon: PauseCircle },
  LOCKED: { variant: "destructive", Icon: Lock },
  INACTIVE: { variant: "neutral", Icon: CircleSlash },
  PASSWORD_EXPIRED: { variant: "warning", Icon: TriangleAlert },
  REJECTED: { variant: "destructive", Icon: ShieldX },
  DELETED: { variant: "destructive", Icon: Trash2 },
};

export function UserStatusBadge({ status, rejectionReason }: UserStatusBadgeProps) {
  const { variant, Icon } = presentation[status] ?? presentation.INACTIVE;

  const badge = (
    <Badge variant={variant}>
      <Icon aria-hidden="true" />
      {titleCase(status)}
    </Badge>
  );

  if (status === "REJECTED" && rejectionReason) {
    return (
      <Tooltip content={
        <span className="max-w-xs whitespace-normal text-xs">{rejectionReason}</span>
      }>
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
