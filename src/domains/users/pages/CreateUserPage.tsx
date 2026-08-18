import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/common/InlineAlert";
import { FormField } from "@/components/common/FormField";
import { SectionCard } from "@/components/common/SectionCard";

import { PasswordField } from "@/domains/auth/components/PasswordField";
import { PasswordStrengthMeter } from "@/domains/auth/components/PasswordStrengthMeter";

import { ModuleHeader } from "../components/ModuleHeader";
import { PermissionMatrix } from "../components/PermissionMatrix";
import { RolePicker } from "../components/RolePicker";
import { UserFormFields } from "../components/UserFormFields";
import { saveCreatedCredentials } from "../data/createdCredentials";
import { rolePermissionPresets } from "../data/permissions";
import { useCreateUser } from "../hooks/useUsers";
import { useRolesCatalogue } from "../hooks/useRoles";
import {
  ADMIN_ROLE_CREATION_MESSAGE,
  createUserSchema,
  type CreateUserFormValues,
} from "../schema";

/**
 * Serialised form of the selected role set, so the permission-sync effect
 * below only reacts to actual role changes (not every keystroke/render).
 */
function roleKey(roles: string[]): string {
  return [...roles].sort().join("|");
}

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const catalogue = useRolesCatalogue();

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
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      roles: ["CREATOR"],
      permissions: rolePermissionPresets.CREATOR,
      reason: "",
    },
  });

  const selectedRoles = watch("roles");

  const previousRoleKey = useRef(roleKey(selectedRoles ?? []));

  // The backend only approves a user creation when every granted permission
  // belongs to one of the selected roles (validatePermissionsBelongToRoles).
  // Whenever the role set changes, sync the matrix to the union of the roles'
  // catalogue permissions so submissions stay valid; the user can still
  // fine-tune from there. Manual permission edits don't retrigger this.
  useEffect(() => {
    const nextKey = roleKey(selectedRoles ?? []);

    if (nextKey === previousRoleKey.current) return;

    previousRoleKey.current = nextKey;

    const byName = new Map(
      (catalogue.data ?? []).map((role) => [role.name.toUpperCase(), role]),
    );

    const allowed = new Set<string>();

    for (const roleName of selectedRoles ?? []) {
      const role = byName.get(roleName.toUpperCase());

      if (role) {
        for (const permission of role.permissions) allowed.add(permission);
      }
    }

    if (allowed.size > 0) {
      setValue("permissions", [...allowed], { shouldValidate: true });
    }
  }, [selectedRoles, catalogue.data, setValue]);

  const createUser = useCreateUser({
    onSuccess: (user) => {
      toast.success(
        `${user.firstName} ${user.lastName} was created and queued for approval.`,
      );
      navigate("/users/list");
    },
    onError: setFormError,
  });

  const password = watch("password");

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError(null);

      try {
        const created = await createUser.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          username: values.username,
          email: values.email,
          password: values.password,
          roles: values.roles,
          permissions: values.permissions,
          reason: values.reason,
        });

        // The backend never returns the password again, so keep it locally
        // for the "Email credentials" action in the users table.
        saveCreatedCredentials(created.id, created.username, values.password);
      } catch {
        // Surfaced through formError by the onError callback.
      }
    },
    (validationErrors) => {
      // The ADMIN-role rejection is a workflow rule, not a field typo, so
      // it gets a toast on top of the inline error under the Roles field.
      if (validationErrors.roles?.message === ADMIN_ROLE_CREATION_MESSAGE) {
        toast.error(ADMIN_ROLE_CREATION_MESSAGE);
      }
    },
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ModuleHeader
        title="Create user"
        description="Add an account and grant it the access it needs. The account goes live once an authorizer approves the request."
        eyebrow={
          <Link
            to="/users/list"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
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
          <UserFormFields register={register} errors={errors} />

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
        title="Roles"
        description="Pick one or more roles. Permissions are granted per role and per user."
      >
        <FormField
          label="Roles"
          required
          hint="Type a role name and press Enter, or tap a suggestion. Permissions below follow the selected roles' capabilities. The ADMIN role can't be granted here — administrator accounts are provisioned directly, outside the approval workflow."
          error={errors.roles?.message}
        >
          {(field) => (
            <Controller
              name="roles"
              control={control}
              render={({ field: controlled }) => (
                <RolePicker
                  id={field.id}
                  aria-invalid={field["aria-invalid"]}
                  aria-describedby={field["aria-describedby"]}
                  value={controlled.value}
                  onChange={controlled.onChange}
                  suggestions={catalogue.data?.map((role) => role.name)}
                  exclude={["ADMIN"]}
                />
              )}
            />
          )}
        </FormField>
      </SectionCard>

      <SectionCard
        title="Permissions"
        description="Fine-tune what this user can do beyond their roles."
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

      <SectionCard
        title="Approval reason"
        description="Required — this justification accompanies the approval request."
      >
        <FormField
          label="Reason"
          required
          error={errors.reason?.message}
        >
          {(field) => (
            <Textarea
              {...field}
              {...register("reason")}
              rows={3}
              placeholder="e.g. New starter joining the finance team from 1 September"
            />
          )}
        </FormField>
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
