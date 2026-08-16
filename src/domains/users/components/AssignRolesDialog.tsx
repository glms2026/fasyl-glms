import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";

import { useRolesCatalogue } from "../hooks/useRoles";
import { assignRolesSchema, type AssignRolesFormValues } from "../schema";
import type { ManagedUser } from "../types";

import { RolePicker } from "./RolePicker";

interface AssignRolesDialogProps {
  user: ManagedUser | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (roles: string[], reason: string) => void;
  isPending?: boolean;
  error?: string | null;
}

/** Role changes go through the maker-checker queue, so a reason is required. */
export function AssignRolesDialog({
  user,
  open,
  onClose,
  onConfirm,
  isPending = false,
  error,
}: AssignRolesDialogProps) {
  const catalogue = useRolesCatalogue();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignRolesFormValues>({
    resolver: zodResolver(assignRolesSchema),
    defaultValues: { roles: [], reason: "" },
  });

  useEffect(() => {
    if (open && user) {
      reset({ roles: [...user.roles], reason: "" });
    }
  }, [open, user, reset]);

  const submit = handleSubmit((values) => onConfirm(values.roles, values.reason));

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={isPending}
      size="md"
      title="Assign roles"
      description={
        user
          ? `Role changes for ${user.firstName} ${user.lastName} are queued for approval.`
          : undefined
      }
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
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <InlineAlert variant="error">{error}</InlineAlert>}

        <FormField
          label="Roles"
          required
          error={errors.roles?.message}
        >
          {(field) => (
            <Controller
              name="roles"
              control={control}
              render={({ field: controlled }) => (
                <RolePicker
                  id={field.id}
                  aria-invalid={field["aria-invalid"]}
                  aria-describedby={field["aria-describedby"]}
                  value={controlled.value}
                  onChange={controlled.onChange}
                  suggestions={catalogue.data?.map((role) => role.name)}
                />
              )}
            />
          )}
        </FormField>

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
              placeholder="e.g. Promoting to a control role after the quarterly review"
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
