import { User } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

interface ForgotPasswordFormProps {
  onSubmit: (values: ForgotPasswordFormValues) => Promise<void> | void;
  loading?: boolean;
}

export function ForgotPassword({
  onSubmit,
  loading = false,
}: ForgotPasswordFormProps) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Heading */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semiboldtracking-tight">Reset password</h1>

        <p className="text-gray-500">
          Enter your username or email address to reset password
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

      <button
        type="button"
        className="text-sm font-medium text-neutral-600 hover:text-black"
        onClick={() => navigate("/")}
      >
        I know my password
      </button>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-lg bg-[#001a42]/90 text-white hover:bg-[#001a42]"
      >
        {loading ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
