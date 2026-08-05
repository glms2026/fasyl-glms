import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/common/SearchInput";
import { titleCase } from "@/lib/format";

import { UserRole, UserStatus } from "../types";

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
}

export function UserFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  role,
  onRoleChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        label="Search users"
        placeholder="Search by name, username or email"
        className="sm:max-w-sm sm:flex-1"
      />

      <div className="flex gap-3">
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="sm:w-40"
        >
          <option value="ALL">All statuses</option>

          {Object.values(UserStatus).map((value) => (
            <option key={value} value={value}>
              {titleCase(value)}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filter by role"
          value={role}
          onChange={(event) => onRoleChange(event.target.value)}
          className="sm:w-36"
        >
          <option value="ALL">All roles</option>

          {Object.values(UserRole).map((value) => (
            <option key={value} value={value}>
              {titleCase(value)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
