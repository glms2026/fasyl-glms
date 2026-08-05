import { User } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { InlineAlert } from "@/components/common/InlineAlert";

import { loginSchema, type LoginFormValues } from "../schema";
import { AuthHeading } from "./AuthHeading";
import { PasswordField } from "./PasswordField";

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
  notice?: string | null;
}

export function LoginForm({
  onSubmit,
  loading = false,
  error,
  notice,
}: LoginFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberDevice: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <AuthHeading
        title="Sign in"
        description="Enter your credentials to access the ledger."
      />

      {notice && <InlineAlert variant="info">{notice}</InlineAlert>}
      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      <div className="space-y-2">
        <Label
          htmlFor="username"
          className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-900"
        >
          Username
        </Label>

        <div className="relative">
          <User
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <Input
            id="username"
            autoComplete="username"
            autoFocus
            placeholder="Enter your username"
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? "username-error" : undefined}
            className="h-12 border-neutral-300 pl-11"
            {...register("username")}
          />
        </div>

        {errors.username && (
          <p id="username-error" className="text-xs font-medium text-red-600">
            {errors.username.message}
          </p>
        )}
      </div>

      <PasswordField
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        forgotPasswordHref="/forgot-password"
        {...register("password")}
      />

      <div className="flex items-center justify-between">
        <Controller
          name="rememberDevice"
          control={control}
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-3">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />

              <span className="text-sm text-neutral-600">
                Remember this device
              </span>
            </label>
          )}
        />

        <Link
          to="/forgot-password"
          className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
        >
          Need help?
        </Link>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full bg-[#001a42] text-white hover:bg-[#001a42]/90"
      >
        {loading && <Spinner />}
        {loading ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
