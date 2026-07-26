import { useState } from "react";

import { AuthLayout } from "../components/AuthLayout";
import { LoginForm } from "../components/LoginForm";
import { type LoginFormValues } from "../schema";

// import { loginUser } from "../services/auth.service";
// import { useAuthStore } from "../store/auth.store";

export default function SignInPage() {
  //   const navigate = useNavigate();

  const [loading] = useState(false);

  //   const { setToken, fetchCurrentUser } = useAuthStore();

  const handleLogin = async (values: LoginFormValues) => {
    console.log(values);
  };

  return (
    <AuthLayout>
      <LoginForm loading={loading} onSubmit={handleLogin} />
    </AuthLayout>
  );
}
