import { useId, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { knownRoles } from "../data/permissions";
import { roleColorClass } from "../data/roleColors";

interface RolePickerProps {
  value: string[];
  onChange: (roles: string[]) => void;
  suggestions?: string[];
  /** Roles that can't be added here — hidden from suggestions and refused
   *  when typed (e.g. ADMIN on user creation, which the backend will never
   *  approve through the maker-checker workflow). */
  exclude?: string[];
  /** Called whenever a role is added, e.g. to apply a permission preset. */
  onAdd?: (role: string) => void;
  error?: string;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Free-form multi-select for role names. Callers pass live suggestions from
 * GET /api/roles; the user can also type any role and add it as a chip.
 * Falls back to the known seed roles while the catalogue loads.
 */
export function RolePicker({
  value,
  onChange,
  suggestions = [...knownRoles],
  exclude = [],
  onAdd,
  error,
  disabled = false,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: RolePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");

  const selected = new Set(value);
  const excluded = new Set(
    exclude.map((role) => role.trim().toUpperCase()),
  );

  const add = (raw: string) => {
    const role = raw.trim().toUpperCase();

    if (!role || selected.has(role) || excluded.has(role)) return;

    onChange([...value, role]);
    setDraft("");
    onAdd?.(role);
  };

  const remove = (role: string) => {
    onChange(value.filter((candidate) => candidate !== role));
  };

  const availableSuggestions = suggestions.filter(
    (role) =>
      !selected.has(role) &&
      !excluded.has(role.trim().toUpperCase()),
  );

  const submitDraft = () => {
    add(draft);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2.5">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((role) => (
            <Badge
              key={role}
              variant="outline"
              className={cn("gap-1.5 py-1 pr-1.5 pl-2.5", roleColorClass(role))}
            >
              <span
                className="size-1.5 rounded-full bg-current opacity-70"
                aria-hidden="true"
              />
              {role}

              <button
                type="button"
                onClick={() => remove(role)}
                disabled={disabled}
                aria-label={`Remove ${role} role`}
                className="rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id={inputId}
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitDraft();
            }

            if (event.key === "Backspace" && draft === "" && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder="Type a role name and press Enter"
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className="h-10 border-neutral-300"
        />

        <button
          type="button"
          onClick={submitDraft}
          disabled={disabled || !draft.trim()}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-neutral-300 px-3.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add
        </button>
      </div>

      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-neutral-400">Suggestions:</span>

          {availableSuggestions.map((role) => (
            <button
              key={role}
              type="button"
              disabled={disabled}
              onClick={() => add(role)}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-600 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
            >
              {role}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
