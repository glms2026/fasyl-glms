import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/common/ErrorState";
import { InlineAlert } from "@/components/common/InlineAlert";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";

import { PermissionMatrix } from "../components/PermissionMatrix";
import { UserFormFields } from "../components/UserFormFields";
import { rolePermissionPresets } from "../data/permissions";
import { useUpdateUser, useUserQuery } from "../hooks/useUsers";
import { editUserSchema, type EditUserFormValues } from "../schema";
import type { UserRole, UserStatus } from "../types";

export default function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const userId = Number(id);
  const { data: user, isLoading, error, refetch } = useUserQuery(userId);

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      role: "VIEWER",
      status: "ACTIVE",
      permissions: [],
    },
  });

  // Seed the form once the user resolves.
  useEffect(() => {
    if (!user) return;

    reset({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
    });
  }, [user, reset]);

  const updateUser = useUpdateUser({
    onSuccess: (updated) => {
      toast.success(`${updated.fullName}'s details have been saved.`);
      navigate(`/users/${updated.id}`);
    },
    onError: setFormError,
  });

  const applyRolePreset = (role: string) => {
    const preset = rolePermissionPresets[role as UserRole];

    if (preset) {
      setValue("permissions", preset, { shouldValidate: true, shouldDirty: true });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await updateUser.mutateAsync({
        id: userId,
        fullName: values.fullName,
        username: values.username,
        email: values.email,
        role: values.role as UserRole,
        status: values.status as UserStatus,
        permissions: values.permissions,
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
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <PageHeader
        title={`Edit ${user?.fullName ?? "user"}`}
        description="Update details, role and access for this account."
        eyebrow={
          <Link
            to={`/users/${userId}`}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
          >
            <ArrowLeft className="size-3.5" />
            Back to profile
          </Link>
        }
      />

      {formError && <InlineAlert variant="error">{formError}</InlineAlert>}

      <SectionCard
        title="Account details"
        description="Changing the status here takes effect immediately."
      >
        <UserFormFields
          register={register}
          errors={errors}
          showStatus
          onRoleChange={applyRolePreset}
        />
      </SectionCard>

      <SectionCard
        title="Assigned permissions"
        description="Fine-tune what this user can do beyond their role."
      >
        <Controller
          name="permissions"
          control={control}
          render={({ field }) => (
            <PermissionMatrix
              value={field.value}
              onChange={field.onChange}
              error={errors.permissions?.message}
            />
          )}
        />
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
          Save changes
        </Button>
      </div>
    </form>
  );
}
