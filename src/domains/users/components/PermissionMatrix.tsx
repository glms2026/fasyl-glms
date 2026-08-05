import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { permissionGroups } from "../data/permissions";

interface PermissionMatrixProps {
  value: string[];
  onChange: (permissions: string[]) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Grouped permission assignment. Groups come from a local catalogue today;
 * the component renders whatever list it's given, so a fetched catalogue
 * drops straight in.
 */
export function PermissionMatrix({
  value,
  onChange,
  error,
  disabled = false,
}: PermissionMatrixProps) {
  const selected = new Set(value);

  const toggle = (key: string) => {
    const next = new Set(selected);

    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }

    onChange([...next]);
  };

  const toggleGroup = (keys: string[], allSelected: boolean) => {
    const next = new Set(selected);

    for (const key of keys) {
      if (allSelected) {
        next.delete(key);
      } else {
        next.add(key);
      }
    }

    onChange([...next]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          {selected.size} permission{selected.size === 1 ? "" : "s"} granted
        </p>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([])}
        >
          Clear all
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {permissionGroups.map((group) => {
          const keys = group.permissions.map((permission) => permission.key);
          const granted = keys.filter((key) => selected.has(key)).length;
          const allSelected = granted === keys.length;

          return (
            <fieldset
              key={group.key}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <legend className="sr-only">{group.label}</legend>

              <div className="flex items-start justify-between gap-3 pb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">
                    {group.label}
                  </p>

                  <p className="text-xs text-neutral-500">
                    {group.description}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleGroup(keys, allSelected)}
                  className="shrink-0 rounded-md text-xs font-medium text-primary transition-colors hover:underline disabled:opacity-50"
                >
                  {allSelected ? "Clear" : "Select all"}
                </button>
              </div>

              <div className="space-y-2.5 border-t border-neutral-100 pt-3">
                {group.permissions.map((permission) => {
                  const checked = selected.has(permission.key);

                  return (
                    <label
                      key={permission.key}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-neutral-50",
                        disabled && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={() => toggle(permission.key)}
                        className="mt-0.5"
                      />

                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-neutral-800">
                          {permission.label}
                        </span>

                        <span className="block text-xs text-neutral-500">
                          {permission.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
