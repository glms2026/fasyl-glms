import { useState } from "react";

import { getApiErrorMessage } from "@/lib/errors";

import { AuthLayout } from "../components/AuthLayout";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";
import { authService } from "../services/authService";
import type { ForgotPasswordFormValues } from "../schema";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const message = await authService.forgotPassword({ email: values.email });

      setSuccessMessage(
        typeof message === "string" && message.trim()
          ? message
          : "If that email is on file, a reset link is on its way.",
      );
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <ForgotPasswordForm
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        successMessage={successMessage}
      />
    </AuthLayout>
  );
}
