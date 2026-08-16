import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/common/ErrorState";
import { InlineAlert } from "@/components/common/InlineAlert";
import { SectionCard } from "@/components/common/SectionCard";

import { ModuleHeader } from "../components/ModuleHeader";
import { UserFormFields } from "../components/UserFormFields";
import { useUpdateUser, useUserQuery } from "../hooks/useUsers";
import { editUserSchema, type EditUserFormValues } from "../schema";

export default function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const userId = Number(id);
  const { data: user, isLoading, error, refetch } = useUserQuery(userId);

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      status: "ACTIVE",
    },
  });

  // Seed the form once the user resolves.
  useEffect(() => {
    if (!user) return;

    reset({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      status: user.status as EditUserFormValues["status"],
    });
  }, [user, reset]);

  const updateUser = useUpdateUser({
    onSuccess: () => {
      toast.success("Changes submitted for approval.");
      navigate(`/users/${userId}`);
    },
    onError: setFormError,
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await updateUser.mutateAsync({
        id: userId,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          username: values.username,
          email: values.email,
          status: values.status,
        },
      });
    } catch {
      // Surfaced through formError by the onError callback.
    }
  });

  if (error) {
    return (
      <ErrorState
        title="Couldn't load this user"
        message={error}
        onRetry={refetch}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ModuleHeader
        title={`Edit ${user?.firstName ?? "user"}`}
        description="Update details and status for this account. Changes are queued for approval."
        eyebrow={
          <Link
            to={`/users/${userId}`}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to profile
          </Link>
        }
      />

      {formError && <InlineAlert variant="error">{formError}</InlineAlert>}

      <SectionCard
        title="Account details"
        description="Roles and permissions are managed separately — changing them queues their own approval request."
      >
        <UserFormFields register={register} errors={errors} showStatus />
      </SectionCard>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => navigate(`/users/${userId}`)}
          disabled={updateUser.isPending}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          size="lg"
          disabled={updateUser.isPending || !isDirty}
        >
          {updateUser.isPending && <Spinner />}
          Submit for approval
        </Button>
      </div>
    </form>
  );
}
