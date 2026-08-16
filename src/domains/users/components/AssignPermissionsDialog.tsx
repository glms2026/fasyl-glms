import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";

import { PermissionMatrix } from "./PermissionMatrix";

const assignPermissionsSchema = z.object({
  permissions: z.array(z.string()).min(1, "Choose at least one permission"),
  reason: z
    .string()
    .trim()
    .min(3, "Add a short reason (at least 3 characters)")
    .max(1000, "Keep the reason under 1,000 characters"),
});

type AssignPermissionsFormValues = z.infer<typeof assignPermissionsSchema>;

interface AssignPermissionsDialogProps {
  role: string | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (permissions: string[], reason: string) => void;
  isPending?: boolean;
  error?: string | null;
}

/** Assigns a permission set to a role; queued for approval by an authorizer. */
export function AssignPermissionsDialog({
  role,
  open,
  onClose,
  onConfirm,
  isPending = false,
  error,
}: AssignPermissionsDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignPermissionsFormValues>({
    resolver: zodResolver(assignPermissionsSchema),
    defaultValues: { permissions: [], reason: "" },
  });

  useEffect(() => {
    if (open) reset({ permissions: [], reason: "" });
  }, [open, reset]);

  const submit = handleSubmit((values) =>
    onConfirm(values.permissions, values.reason),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={isPending}
      size="lg"
      title={role ? `Assign permissions to ${role}` : "Assign permissions"}
      description="The new permission set is queued for approval before it takes effect."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>

          <Button onClick={submit} disabled={isPending}>
            {isPending && <Spinner />}
            Submit for approval
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <InlineAlert variant="error">{error}</InlineAlert>}

        <Controller
          name="permissions"
          control={control}
          render={({ field }) => (
            <PermissionMatrix
              value={field.value}
              onChange={field.onChange}
              error={errors.permissions?.message}
            />
          )}
        />

        <FormField
          label="Reason"
          required
          hint="Required. Shown to the authorizer on the approval request."
          error={errors.reason?.message}
        >
          {(field) => (
            <Textarea
              {...field}
              {...register("reason")}
              rows={3}
              placeholder="e.g. Granting report export access to the control role"
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
