import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { getPasswordStrength } from "../utils/passwordStrength";

interface PasswordStrengthMeterProps {
  password: string;
}

const requirements = [
  { key: "minLength", label: "8+ characters" },
  { key: "uppercase", label: "Uppercase letter" },
  { key: "lowercase", label: "Lowercase letter" },
  { key: "number", label: "Number" },
  { key: "special", label: "Special character" },
] as const;

const barTone = [
  "bg-neutral-200",
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
];

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  const { score, label, checks } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/70 p-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-1.5 flex-1 gap-1"
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-label={`Password strength: ${label}`}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-full flex-1 rounded-full transition-colors",
                index < score ? barTone[score] : "bg-neutral-200",
              )}
            />
          ))}
        </div>

        <span className="w-20 shrink-0 text-right text-xs font-medium text-neutral-600">
          {label}
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {requirements.map(({ key, label: requirement }) => {
          const met = checks[key];

          return (
            <li
              key={key}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                met ? "text-emerald-600" : "text-neutral-500",
              )}
            >
              {met ? (
                <Check className="size-3 shrink-0" aria-hidden="true" />
              ) : (
                <X className="size-3 shrink-0 text-neutral-300" aria-hidden="true" />
              )}
              {requirement}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
