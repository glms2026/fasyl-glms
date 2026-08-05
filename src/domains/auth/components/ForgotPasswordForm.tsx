import { Mail } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { InlineAlert } from "@/components/common/InlineAlert";

import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schema";
import { AuthHeading } from "./AuthHeading";

interface ForgotPasswordFormProps {
  onSubmit: (values: ForgotPasswordFormValues) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
  successMessage?: string | null;
}

export function ForgotPasswordForm({
  onSubmit,
  loading = false,
  error,
  successMessage,
}: ForgotPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <AuthHeading
        title="Reset your password"
        description="Enter the email on your account and we'll send a reset link."
      />

      {successMessage && (
        <InlineAlert variant="success">{successMessage}</InlineAlert>
      )}

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-900"
        >
          Email address
        </Label>

        <div className="relative">
          <Mail
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-12 border-neutral-300 pl-11"
            {...register("email")}
          />
        </div>

        {errors.email && (
          <p id="email-error" className="text-xs font-medium text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full bg-[#001a42] text-white hover:bg-[#001a42]/90"
      >
        {loading && <Spinner />}
        {loading ? "Sending link" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-neutral-500">
        Remembered it?{" "}
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
