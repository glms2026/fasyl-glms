import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Link } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  /** Renders a "Forgot password?" link beside the label when provided. */
  forgotPasswordHref?: string;
}

export const PasswordField = React.forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(({ label = "Password", error, forgotPasswordHref, className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  const generatedId = React.useId();
  const id = props.id ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-900"
        >
          {label}
        </Label>

        {forgotPasswordHref && (
          <Link
            to={forgotPasswordHref}
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Forgot password?
          </Link>
        )}
      </div>

      <div className="relative">
        <Lock
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
        />

        <Input
          {...props}
          id={id}
          ref={ref}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-12 border-neutral-300 pl-11 pr-11",
            error && "border-red-500",
            className,
          )}
        />

        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100"
        >
          {visible ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>

      {error && (
        <p id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

PasswordField.displayName = "PasswordField";
