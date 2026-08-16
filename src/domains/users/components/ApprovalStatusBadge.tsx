import { Ban, CheckCircle2, CircleSlash, Hourglass } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";

const presentation = {
  PENDING: { variant: "info", Icon: Hourglass },
  APPROVED: { variant: "success", Icon: CheckCircle2 },
  REJECTED: { variant: "destructive", Icon: Ban },
  CANCELLED: { variant: "neutral", Icon: CircleSlash },
} as const;

interface ApprovalStatusBadgeProps {
  status: string;
}

export function ApprovalStatusBadge({ status }: ApprovalStatusBadgeProps) {
  const { variant, Icon } =
    presentation[status as keyof typeof presentation] ?? presentation.PENDING;

  return (
    <Badge variant={variant}>
      <Icon aria-hidden="true" />
      {titleCase(status)}
    </Badge>
  );
}
