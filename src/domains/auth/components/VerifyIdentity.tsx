import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OTPInput } from "@/components/ui/otp-input";
import { Label } from "@/components/ui/label";

interface VerifyIdentityProps {
  otp: string;
  loading?: boolean;
  onOtpChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
  onBack: () => void;
}

export default function VerifyIdentity({
  otp,
  loading = false,
  onOtpChange,
  onSubmit,
  onResend,
  onBack,
}: VerifyIdentityProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Heading */}
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#001a42] text-white shadow-sm">
          <ShieldCheck size={24} />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">
          Verify Your Identity
        </h1>

        <p className="text-gray-500">
          Enter the verification code sent to your device ending in{" "}
          <span className="font-semibold text-neutral-900">••••56</span>
        </p>
      </div>

      {/* OTP */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-[0.2em]">
          Verification Code
        </Label>

        <OTPInput value={otp} onChange={onOtpChange} length={6} />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading || otp?.length !== 6}
        className="h-12 w-full rounded-lg bg-[#001a42]/90 text-white hover:bg-[#001a42]"
      >
        {loading ? "Verifying..." : "Verify & Sign In"}
      </Button>

      {/* Footer Actions */}
      <div className="space-y-3 text-center">
        <p className="text-sm text-neutral-500">
          Didn't receive a code?{" "}
          <button
            type="button"
            onClick={onResend}
            className="font-semibold text-[#001a42] hover:underline"
          >
            Resend
          </button>
        </p>

        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-neutral-600 hover:text-black"
        >
          Back to login
        </button>
      </div>
    </form>
  );
}
