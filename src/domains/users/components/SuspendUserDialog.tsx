import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";

import { suspendUserSchema, type SuspendUserFormValues } from "../schema";
import type { ManagedUser } from "../types";

interface SuspendUserDialogProps {
  user: ManagedUser | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  isPending?: boolean;
  error?: string | null;
}

/** Indefinite block — an administrator has to reactivate the account. */
export function SuspendUserDialog({
  user,
  open,
  onClose,
  onConfirm,
  isPending = false,
  error,
}: SuspendUserDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuspendUserFormValues>({
    resolver: zodResolver(suspendUserSchema),
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
      title="Suspend account"
      description={
        user
          ? `${user.fullName} will lose access until an administrator reactivates the account.`
          : undefined
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>

          <Button variant="destructive" onClick={submit} disabled={isPending}>
            {isPending && <Spinner />}
            Suspend account
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <InlineAlert variant="error">{error}</InlineAlert>}

        <FormField
          label="Reason"
          hint="Optional. Shown in the audit trail."
          error={errors.reason?.message}
        >
          {(field) => (
            <Textarea
              {...field}
              {...register("reason")}
              data-autofocus
              rows={3}
              placeholder="e.g. Pending internal review"
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
