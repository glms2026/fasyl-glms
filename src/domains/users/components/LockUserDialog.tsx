import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";

import { lockUserSchema, toMinutes, type LockUserFormValues } from "../schema";
import type { ManagedUser } from "../types";

interface LockUserDialogProps {
  user: ManagedUser | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (durationMinutes: number) => void;
  isPending?: boolean;
  error?: string | null;
}

const units = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
] as const;

/** Temporarily blocks sign-in for a fixed window. */
export function LockUserDialog({
  user,
  open,
  onClose,
  onConfirm,
  isPending = false,
  error,
}: LockUserDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LockUserFormValues>({
    resolver: zodResolver(lockUserSchema),
    defaultValues: { duration: 30, unit: "minutes" },
  });

  // Every open should start from the default window, not the last one used.
  useEffect(() => {
    if (open) reset({ duration: 30, unit: "minutes" });
  }, [open, reset]);

  const duration = watch("duration");
  const unit = watch("unit");

  const submit = handleSubmit((values) => onConfirm(toMinutes(values)));

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={isPending}
      size="sm"
      title="Lock account"
      description={
        user
          ? `${user.fullName} won't be able to sign in until the lock expires.`
          : undefined
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>

          <Button onClick={submit} disabled={isPending}>
            {isPending && <Spinner />}
            Lock account
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <InlineAlert variant="error">{error}</InlineAlert>}

        <div className="grid grid-cols-[1fr_9rem] gap-3">
          <FormField label="Lock for" error={errors.duration?.message} required>
            {(field) => (
              <Controller
                name="duration"
                control={control}
                render={({ field: controlled }) => (
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    data-autofocus
                    className="h-10 border-neutral-300"
                    value={Number.isNaN(controlled.value) ? "" : controlled.value}
                    onChange={(event) =>
                      controlled.onChange(
                        event.target.value === ""
                          ? Number.NaN
                          : Number(event.target.value),
                      )
                    }
                  />
                )}
              />
            )}
          </FormField>

          <FormField label="Unit" error={errors.unit?.message}>
            {(field) => (
              <Controller
                name="unit"
                control={control}
                render={({ field: controlled }) => (
                  <Select {...field} {...controlled}>
                    {units.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}
              />
            )}
          </FormField>
        </div>

        {!errors.duration && Number.isFinite(duration) && (
          <p className="text-sm text-neutral-500">
            Access resumes automatically after{" "}
            <span className="font-medium text-neutral-700">
              {duration} {unit}
            </span>
            .
          </p>
        )}
      </form>
    </Modal>
  );
}
