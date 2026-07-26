import { User } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { loginSchema, type LoginFormValues } from "../schema";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "./PasswordField";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  loading?: boolean;
}

export function LoginForm({ onSubmit, loading = false }: LoginFormProps) {
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

  const navigate = useNavigate();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Heading */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign In</h1>

        <p className="text-gray-500">
          Enter your credentials to access your account
        </p>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-[0.2em]">
          Username / Email
        </Label>

        <div className="relative">
          <User
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <Input
            {...register("username")}
            placeholder="Enter username or email"
            className="h-12 pl-11"
          />
        </div>

        {errors.username && (
          <p className="text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

      {/* Password */}
      <PasswordField
        label="Password"
        placeholder="••••••••••••"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
        onForgotPassword={() => {
          navigate("/forgot-password");
        }}
      />

      {/* Remember Device */}
      <div className="flex items-center justify-between">
        <Controller
          name="rememberDevice"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-3 cursor-pointer">
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

        <button
          type="button"
          className="text-sm font-medium text-neutral-600 hover:text-black"
        >
          Need Help?
        </button>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-lg bg-[#001a42]/90 text-white hover:bg-[#001a42]"
      >
        {loading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
