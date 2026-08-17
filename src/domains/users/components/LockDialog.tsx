import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Infinity as InfinityIcon, Timer } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";
import { cn } from "@/lib/utils";

import { lockUserSchema, type LockUserFormValues } from "../schema";

export interface LockPayload {
  reason: string;
  /** Omitted for indefinite locks. */
  durationMinutes?: number;
}

interface LockDialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm: (payload: LockPayload) => void;
  isPending?: boolean;
  error?: string | null;
}

/**
 * Collects the justification and duration for a lock. Locks are now
 * duration-based: pick "Temporary" to auto-expire after 1–60 minutes, or
 * "Indefinite" to keep the account locked until an administrator intervenes
 * (the backend no longer exposes an unlock endpoint).
 */
export function LockDialog({
  open,
  title,
  description,
  onClose,
  onConfirm,
  isPending = false,
  error,
}: LockDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LockUserFormValues>({
    resolver: zodResolver(lockUserSchema),
    defaultValues: { reason: "", mode: "temporary", durationMinutes: 30 },
  });

  const mode = watch("mode");

  useEffect(() => {
    if (open) reset({ reason: "", mode: "temporary", durationMinutes: 30 });
  }, [open, reset]);

  const submit = handleSubmit((values) =>
    onConfirm({
      reason: values.reason,
      durationMinutes:
        values.mode === "temporary" ? values.durationMinutes : undefined,
    }),
  );

  const modes = [
    {
      value: "temporary" as const,
      label: "Temporary",
      description: "Auto-unlocks after a set time",
      icon: Timer,
    },
    {
      value: "indefinite" as const,
      label: "Indefinite",
      description: "Stays locked until an administrator intervenes",
      icon: InfinityIcon,
    },
  ];

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

          <Button onClick={submit} disabled={isPending}>
            {isPending && <Spinner />}
            Submit lock request
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <InlineAlert variant="error">{error}</InlineAlert>}

        <FormField
          label="Lock type"
          required
          hint={
            mode === "temporary"
              ? "The account unlocks automatically when the time elapses."
              : "No duration is set — the account stays locked until an administrator acts."
          }
        >
          {() => (
            <div className="grid grid-cols-2 gap-2">
              {modes.map(({ value, label, description: optionDescription, icon: Icon }) => {
                const selected = mode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setValue("mode", value, { shouldValidate: true })}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all outline-none",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-neutral-200 bg-white hover:border-neutral-300",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-lg",
                        selected
                          ? "bg-primary/15 text-primary"
                          : "bg-neutral-100 text-neutral-500",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        selected ? "text-primary" : "text-neutral-800",
                      )}
                    >
                      {label}
                    </span>
                    <span className="text-xs leading-snug text-neutral-500">
                      {optionDescription}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </FormField>

        {mode === "temporary" && (
          <FormField
            label="Lock duration"
            required
            error={errors.durationMinutes?.message}
            hint="Between 1 and 60 minutes."
          >
            {({ id, "aria-invalid": ariaInvalid, "aria-describedby": describedBy }) => (
              <div className="relative">
                <Input
                  id={id}
                  type="number"
                  min={1}
                  max={60}
                  inputMode="numeric"
                  aria-invalid={ariaInvalid}
                  aria-describedby={describedBy}
                  className="h-10 pr-16"
                  {...register("durationMinutes", {
                    setValueAs: (value) =>
                      value === "" ? undefined : Number(value),
                  })}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                  minutes
                </span>
              </div>
            )}
          </FormField>
        )}

        <FormField
          label="Reason"
          required
          hint="Required. Shown to the authorizer on the approval request."
          error={errors.reason?.message}
        >
          {({ id, "aria-invalid": ariaInvalid, "aria-describedby": describedBy }) => (
            <Textarea
              id={id}
              {...register("reason")}
              data-autofocus
              rows={3}
              aria-invalid={ariaInvalid}
              aria-describedby={describedBy}
              placeholder="e.g. Account under investigation by compliance"
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
