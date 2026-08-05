import { CheckCircle2, CircleSlash, Clock, Lock, PauseCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";

import type { UserStatus } from "../types";

interface UserStatusBadgeProps {
  status: UserStatus;
}

const presentation = {
  ACTIVE: { variant: "success", Icon: CheckCircle2 },
  SUSPENDED: { variant: "warning", Icon: PauseCircle },
  LOCKED: { variant: "destructive", Icon: Lock },
  INACTIVE: { variant: "neutral", Icon: CircleSlash },
  PENDING: { variant: "info", Icon: Clock },
} as const;

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const { variant, Icon } = presentation[status] ?? presentation.INACTIVE;

  return (
    <Badge variant={variant}>
      <Icon aria-hidden="true" />
      {titleCase(status)}
    </Badge>
  );
}
