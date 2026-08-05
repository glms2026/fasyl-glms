import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/errors";

import { AuthLayout } from "../components/AuthLayout";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/useAuth";
import type { LoginFormValues } from "../schema";

export default function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notice =
    searchParams.get("reason") === "session-expired"
      ? "Your session has expired. Sign in again to continue."
      : null;

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const user = await login(
        { username: values.username, password: values.password },
        values.rememberDevice,
      );

      toast.success(`Welcome back, ${user.username}`);

      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Sign in failed. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <LoginForm
        onSubmit={handleLogin}
        loading={loading}
        error={error}
        notice={notice}
      />
    </AuthLayout>
  );
}
