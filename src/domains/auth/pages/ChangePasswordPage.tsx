import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { getApiErrorMessage } from "@/lib/errors";

import { ChangePasswordForm } from "../components/ChangePasswordForm";
import { authService } from "../services/authService";
import type { ChangePasswordFormValues } from "../schema";

/** Authenticated screen — reached from the profile menu, not the login flow. */
export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (values: ChangePasswordFormValues) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await authService.changePassword(values);

      setSuccessMessage("Your password has been updated.");
      toast.success("Password updated");
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Change password"
        description="Update the password you use to sign in to GLMS."
      />

      <SectionCard
        title="Password"
        description="You'll stay signed in on this device after the change."
        action={
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-5" aria-hidden="true" />
          </span>
        }
      >
        <ChangePasswordForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard")}
          loading={loading}
          error={error}
          successMessage={successMessage}
        />
      </SectionCard>
    </div>
  );
}
