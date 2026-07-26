import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AuthLayout } from "../components/AuthLayout";
import { LoginForm } from "../components/LoginForm";
import { type LoginFormValues } from "../schema";

// import { loginUser } from "../services/auth.service";
// import { useAuthStore } from "../store/auth.store";

export default function SignInPage() {
  //   const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  //   const { setToken, fetchCurrentUser } = useAuthStore();

  const handleLogin = async (values: LoginFormValues) => {};

  return (
    <AuthLayout>
      <LoginForm loading={loading} onSubmit={handleLogin} />
    </AuthLayout>
  );
}
