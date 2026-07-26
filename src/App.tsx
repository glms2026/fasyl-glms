import { BrowserRouter, Routes, Route } from "react-router-dom";

import SignInPage from "@/domains/auth/pages/SignInPage";
import ForgotPasswordPage from "./domains/auth/pages/ForgotPasswordPage";
import VerifyIdentity from "./domains/auth/pages/VerifyIdentityPage";
import DashboardPage from "./domains/dashboard/pages/DashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyIdentity />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
