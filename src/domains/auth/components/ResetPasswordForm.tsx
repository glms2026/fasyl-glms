import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { InlineAlert } from "@/components/common/InlineAlert";

import { resetPasswordSchema, type ResetPasswordFormValues } from "../schema";
import { AuthHeading } from "./AuthHeading";
import { PasswordField } from "./PasswordField";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

interface ResetPasswordFormProps {
  onSubmit: (values: ResetPasswordFormValues) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
  /** Missing token means the link was incomplete — block submission. */
  tokenMissing?: boolean;
}

export function ResetPasswordForm({
  onSubmit,
  loading = false,
  error,
  tokenMissing = false,
}: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const newPassword = watch("newPassword");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <AuthHeading
        title="Choose a new password"
        description="Pick something you haven't used on this account before."
      />

      {tokenMissing && (
        <InlineAlert variant="error">
          This reset link is missing its token. Request a new link to continue.
        </InlineAlert>
      )}

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      <PasswordField
        label="New password"
        placeholder="Enter a new password"
        autoComplete="new-password"
        autoFocus
        disabled={tokenMissing}
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />

      <PasswordStrengthMeter password={newPassword ?? ""} />

      <PasswordField
        label="Confirm password"
        placeholder="Re-enter the new password"
        autoComplete="new-password"
        disabled={tokenMissing}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button
        type="submit"
        disabled={loading || tokenMissing}
        className="h-12 w-full bg-[#001a42] text-white hover:bg-[#001a42]/90"
      >
        {loading && <Spinner />}
        {loading ? "Updating password" : "Update password"}
      </Button>

      <p className="text-center text-sm text-neutral-500">
        <Link
          to="/login"
          className="font-medium text-neutral-900 underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
