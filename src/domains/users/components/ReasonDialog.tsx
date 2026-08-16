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
  actionReasonSchema,
  type ActionReasonFormValues,
} from "../schema";

interface ReasonDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  /** "default" for lock/deactivate, "destructive" for suspension. */
  tone?: "default" | "destructive";
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
  error?: string | null;
  hint?: string;
}

/**
 * Collects the mandatory justification for approval-gated actions (lock,
 * suspend, deactivate). The reason travels with the approval request so the
 * authorizer can see why the change was made.
 */
export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  onClose,
  onConfirm,
  isPending = false,
  error,
  hint = "Required. Shown to the authorizer on the approval request.",
}: ReasonDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActionReasonFormValues>({
    resolver: zodResolver(actionReasonSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) reset({ reason: "" });
  }, [open, reset]);

  const submit = handleSubmit((values) => onConfirm(values.reason));

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={isPending}
      size="sm"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>

          <Button
            variant={tone === "destructive" ? "destructive" : "default"}
            onClick={submit}
            disabled={isPending}
          >
            {isPending && <Spinner />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <InlineAlert variant="error">{error}</InlineAlert>}

        <FormField
          label="Reason"
          required
          hint={hint}
          error={errors.reason?.message}
        >
          {(field) => (
            <Textarea
              {...field}
              {...register("reason")}
              data-autofocus
              rows={3}
              placeholder="e.g. Account under investigation by compliance"
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
