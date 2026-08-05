import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { InlineAlert } from "@/components/common/InlineAlert";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";

import { PasswordField } from "@/domains/auth/components/PasswordField";
import { PasswordStrengthMeter } from "@/domains/auth/components/PasswordStrengthMeter";

import { PermissionMatrix } from "../components/PermissionMatrix";
import { UserFormFields } from "../components/UserFormFields";
import { rolePermissionPresets } from "../data/permissions";
import { useCreateUser } from "../hooks/useUsers";
import { createUserSchema, type CreateUserFormValues } from "../schema";
import type { UserRole } from "../types";

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      role: "VIEWER",
      permissions: rolePermissionPresets.VIEWER,
    },
  });

  const createUser = useCreateUser({
    onSuccess: (user) => {
      toast.success(`${user.fullName} can now sign in.`);
      navigate("/users/list");
    },
    onError: setFormError,
  });

  const password = watch("password");

  // Picking a role reseeds the permission matrix with that role's baseline.
  const applyRolePreset = (role: string) => {
    const preset = rolePermissionPresets[role as UserRole];

    if (preset) {
      setValue("permissions", preset, { shouldValidate: true });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await createUser.mutateAsync({
        fullName: values.fullName,
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role as UserRole,
        permissions: values.permissions,
      });
    } catch {
      // Surfaced through formError by the onError callback.
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <PageHeader
        title="Create user"
        description="Add an account and grant it the access it needs."
        eyebrow={
          <Link
            to="/users/list"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
          >
            <ArrowLeft className="size-3.5" />
            Back to users
          </Link>
        }
      />

      {formError && <InlineAlert variant="error">{formError}</InlineAlert>}

      <SectionCard
        title="Account details"
        description="These details identify the user across the system."
      >
        <div className="space-y-5">
          <UserFormFields
            register={register}
            errors={errors}
            onRoleChange={applyRolePreset}
          />

          <div className="space-y-4 border-t border-neutral-100 pt-5">
            <PasswordField
              label="Temporary password"
              placeholder="Set a starting password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <PasswordStrengthMeter password={password ?? ""} />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Permissions"
        description="Adjust the defaults that came with the selected role."
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
          onClick={() => navigate("/users/list")}
          disabled={createUser.isPending}
        >
          Cancel
        </Button>

        <Button type="submit" size="lg" disabled={createUser.isPending}>
          {createUser.isPending && <Spinner />}
          Create user
        </Button>
      </div>
    </form>
  );
}
