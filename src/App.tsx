import { BrowserRouter, Routes, Route } from "react-router-dom";

import SignInPage from "@/domains/auth/pages/SignInPage";
import ForgotPasswordPage from "./domains/auth/pages/ForgotPasswordPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </BrowserRouter>
  );
}
