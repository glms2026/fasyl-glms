import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/errors";

import { AuthLayout } from "../components/AuthLayout";
import { ResetPasswordForm } from "../components/ResetPasswordForm";
import { authService } from "../services/authService";
import type { ResetPasswordFormValues } from "../schema";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword({
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      toast.success("Password updated. Sign in with your new password.");

      navigate("/login", { replace: true });
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <ResetPasswordForm
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        tokenMissing={!token}
      />
    </AuthLayout>
  );
}
