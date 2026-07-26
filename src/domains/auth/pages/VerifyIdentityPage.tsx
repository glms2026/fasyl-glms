import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthLayout } from "../components/AuthLayout";
import VerifyIdentity from "../components/VerifyIdentity";

export default function VerifyIdentityPage() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      console.log("OTP:", otp);

      // TODO:
      // await verifyOtp(otp);

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      console.log("Resend OTP");

      // TODO:
      // await resendOtp();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthLayout>
      <VerifyIdentity
        otp={otp}
        onOtpChange={setOtp}
        loading={loading}
        onSubmit={handleSubmit}
        onResend={handleResend}
        onBack={() => navigate("/")}
      />
    </AuthLayout>
  );
}
