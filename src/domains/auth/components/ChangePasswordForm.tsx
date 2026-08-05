import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { InlineAlert } from "@/components/common/InlineAlert";

import { changePasswordSchema, type ChangePasswordFormValues } from "../schema";
import { PasswordField } from "./PasswordField";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

interface ChangePasswordFormProps {
  onSubmit: (values: ChangePasswordFormValues) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
  successMessage?: string | null;
}

export function ChangePasswordForm({
  onSubmit,
  onCancel,
  loading = false,
  error,
  successMessage,
}: ChangePasswordFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {successMessage && (
        <InlineAlert variant="success">{successMessage}</InlineAlert>
      )}

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      <PasswordField
        label="Current password"
        placeholder="Enter your current password"
        autoComplete="current-password"
        error={errors.oldPassword?.message}
        {...register("oldPassword")}
      />

      <PasswordField
        label="New password"
        placeholder="Enter a new password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />

      <PasswordStrengthMeter password={newPassword ?? ""} />

      <PasswordField
        label="Confirm new password"
        placeholder="Re-enter the new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}

        <Button type="submit" size="lg" disabled={loading}>
          {loading && <Spinner />}
          {loading ? "Updating password" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
