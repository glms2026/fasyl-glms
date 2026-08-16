import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/common/FormField";
import { titleCase } from "@/lib/format";

/** Shape shared by the create and edit forms. */
interface UserFieldValues {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  status?: string;
}

interface UserFormFieldsProps<TValues extends UserFieldValues> {
  register: UseFormRegister<TValues>;
  errors: FieldErrors<TValues>;
  /** Edit adds a status control; create doesn't. */
  showStatus?: boolean;
}

const editableStatuses = [
  "ACTIVE",
  "INACTIVE",
  "LOCKED",
  "SUSPENDED",
  "PASSWORD_EXPIRED",
] as const;

export function UserFormFields<TValues extends UserFieldValues>({
  register,
  errors,
  showStatus = false,
}: UserFormFieldsProps<TValues>) {
  // The generic register is cast at each call because TValues is only
  // structurally constrained.
  const field = register as unknown as UseFormRegister<UserFieldValues>;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField
        label="First name"
        required
        error={errors.firstName?.message as string | undefined}
      >
        {(props) => (
          <Input
            {...props}
            {...field("firstName")}
            autoComplete="given-name"
            placeholder="e.g. Adaeze"
            className="h-10 border-neutral-300"
          />
        )}
      </FormField>

      <FormField
        label="Last name"
        required
        error={errors.lastName?.message as string | undefined}
      >
        {(props) => (
          <Input
            {...props}
            {...field("lastName")}
            autoComplete="family-name"
            placeholder="e.g. Okonkwo"
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

      {showStatus && (
        <FormField
          label="Status"
          required
          error={errors.status?.message as string | undefined}
          className="sm:col-span-2"
        >
          {(props) => (
            <Select {...props} {...field("status")} className="sm:max-w-xs">
              {editableStatuses.map((value) => (
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
