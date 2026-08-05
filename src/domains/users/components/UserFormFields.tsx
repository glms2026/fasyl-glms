import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/common/FormField";
import { titleCase } from "@/lib/format";

import { UserRole, UserStatus } from "../types";

/** Shape shared by the create and edit forms. */
interface UserFieldValues {
  fullName: string;
  username: string;
  email: string;
  role: string;
  status?: string;
}

interface UserFormFieldsProps<TValues extends UserFieldValues> {
  register: UseFormRegister<TValues>;
  errors: FieldErrors<TValues>;
  /** Edit adds a status control; create doesn't. */
  showStatus?: boolean;
  onRoleChange?: (role: string) => void;
}

export function UserFormFields<TValues extends UserFieldValues>({
  register,
  errors,
  showStatus = false,
  onRoleChange,
}: UserFormFieldsProps<TValues>) {
  // The generic register is cast at each call because TValues is only
  // structurally constrained.
  const field = register as unknown as UseFormRegister<UserFieldValues>;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField
        label="Full name"
        required
        error={errors.fullName?.message as string | undefined}
        className="sm:col-span-2"
      >
        {(props) => (
          <Input
            {...props}
            {...field("fullName")}
            autoComplete="name"
            placeholder="e.g. Adaeze Okonkwo"
            className="h-10 border-neutral-300"
          />
        )}
      </FormField>

      <FormField
        label="Username"
        required
        hint="Used to sign in. Letters, numbers, dots, underscores or hyphens."
        error={errors.username?.message as string | undefined}
      >
        {(props) => (
          <Input
            {...props}
            {...field("username")}
            autoComplete="username"
            placeholder="e.g. aokonkwo"
            className="h-10 border-neutral-300"
          />
        )}
      </FormField>

      <FormField
        label="Email"
        required
        error={errors.email?.message as string | undefined}
      >
        {(props) => (
          <Input
            {...props}
            {...field("email")}
            type="email"
            autoComplete="email"
            placeholder="name@fasyl.com"
            className="h-10 border-neutral-300"
          />
        )}
      </FormField>

      <FormField
        label="Role"
        required
        hint="Sets the starting permissions below."
        error={errors.role?.message as string | undefined}
      >
        {(props) => {
          const registration = field("role");

          return (
            <Select
              {...props}
              {...registration}
              onChange={(event) => {
                void registration.onChange(event);
                onRoleChange?.(event.target.value);
              }}
            >
              {Object.values(UserRole).map((value) => (
                <option key={value} value={value}>
                  {titleCase(value)}
                </option>
              ))}
            </Select>
          );
        }}
      </FormField>

      {showStatus && (
        <FormField
          label="Status"
          required
          error={errors.status?.message as string | undefined}
        >
          {(props) => (
            <Select {...props} {...field("status")}>
              {Object.values(UserStatus).map((value) => (
                <option key={value} value={value}>
                  {titleCase(value)}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      )}
    </div>
  );
}
