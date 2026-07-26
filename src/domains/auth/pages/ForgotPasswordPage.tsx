import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";

import { AuthLayout } from "../components/AuthLayout";
import { ForgotPassword } from "../components/ForgotPasswordForm";
import { type ForgotPasswordFormValues } from "../schema";

// import { loginUser } from "../services/auth.service";
// import { useAuthStore } from "../store/auth.store";

export default function ForgotPasswordPage() {
  //   const navigate = useNavigate();

  const [loading] = useState(false);

  //   const { setToken, fetchCurrentUser } = useAuthStore();

  const handleResetPassword = async (values: ForgotPasswordFormValues) => {};

  return (
    <AuthLayout>
      <ForgotPassword loading={loading} onSubmit={handleResetPassword} />
    </AuthLayout>
  );
}
