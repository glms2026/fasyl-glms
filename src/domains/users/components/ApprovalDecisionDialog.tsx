import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";

import {
  approvalDecisionSchema,
  type ApprovalDecisionFormValues,
} from "../schema";

interface ApprovalDecisionDialogProps {
  open: boolean;
  /** "approve" | "reject" — drives tone and labels. */
  decision: "approve" | "reject";
  description?: string;
  onClose: () => void;
  onConfirm: (remark?: string) => void;
  isPending?: boolean;
  error?: string | null;
}

/** Authorizer's decision on a maker-checker request, with an optional remark. */
export function ApprovalDecisionDialog({
  open,
  decision,
  description,
  onClose,
  onConfirm,
  isPending = false,
  error,
}: ApprovalDecisionDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApprovalDecisionFormValues>({
    resolver: zodResolver(approvalDecisionSchema),
    defaultValues: { remark: "" },
  });

  useEffect(() => {
    if (open) reset({ remark: "" });
  }, [open, reset]);

  const submit = handleSubmit((values) => onConfirm(values.remark || undefined));

  const isReject = decision === "reject";

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={isPending}
      size="sm"
      title={isReject ? "Reject request" : "Approve request"}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>

          <Button
            variant={isReject ? "destructive" : "default"}
            onClick={submit}
            disabled={isPending}
          >
            {isPending && <Spinner />}
            {isReject ? "Reject request" : "Approve request"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <InlineAlert variant="error">{error}</InlineAlert>}

        {isReject && (
          <p className="text-sm text-neutral-500">
            Rejecting sends the request back to the requester with your remark.
            The change will not be applied.
          </p>
        )}

        <FormField
          label={isReject ? "Reason for rejection" : "Remark"}
          hint="Optional. Shared with the requester and kept in the audit trail."
          error={errors.remark?.message}
        >
          {(field) => (
            <Textarea
              {...field}
              {...register("remark")}
              data-autofocus
              rows={3}
              placeholder={
                isReject
                  ? "e.g. Missing supporting document"
                  : "e.g. Verified against the onboarding checklist"
              }
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
