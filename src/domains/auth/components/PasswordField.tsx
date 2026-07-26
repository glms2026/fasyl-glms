import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showForgotPassword?: boolean;
  onForgotPassword?: () => void;
}

export const PasswordField = React.forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(
  (
    {
      label = "Password",
      error,
      showForgotPassword = true,
      onForgotPassword,
      className,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-900">
            {label}
          </Label>

          {showForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-black"
            >
              Forgot password?
            </button>
          )}
        </div>

        <div className="relative">
          {/* Lock Icon */}
          <Lock
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          {/* Input */}
          <Input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={[
              "h-12",
              "pl-11",
              "pr-11",
              "border-neutral-300",
              error && "border-red-500",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />

          {/* Eye Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 hover:bg-transparent"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-neutral-500" />
            ) : (
              <Eye className="h-4 w-4 text-neutral-500" />
            )}
          </Button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";
