import {
  CheckCircle2,
  CircleSlash,
  Lock,
  PauseCircle,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";

interface UserStatusBadgeProps {
  /** Raw backend status string — unknown values render as neutral. */
  status: string;
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
};

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const { variant, Icon } = presentation[status] ?? presentation.INACTIVE;

  return (
    <Badge variant={variant}>
      <Icon aria-hidden="true" />
      {titleCase(status)}
    </Badge>
  );
}
