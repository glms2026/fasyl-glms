import {
  Eye,
  KeyRound,
  Lock,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  SquarePen,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import type { ManagedUser } from "../types";

interface UserRowActionsProps {
  user: ManagedUser;
  onView: (user: ManagedUser) => void;
  onEdit: (user: ManagedUser) => void;
  onLock: (user: ManagedUser) => void;
  onSuspend: (user: ManagedUser) => void;
  onActivate: (user: ManagedUser) => void;
  onResetPassword: (user: ManagedUser) => void;
}

export function UserRowActions({
  user,
  onView,
  onEdit,
  onLock,
  onSuspend,
  onActivate,
  onResetPassword,
}: UserRowActionsProps) {
  const isActive = user.status === "ACTIVE";

  return (
    <DropdownMenu
      label={`Actions for ${user.fullName}`}
      trigger={
        <span className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800">
          <MoreHorizontal className="size-4" />
        </span>
      }
    >
      {(close) => (
        <>
          <DropdownMenuLabel>Manage</DropdownMenuLabel>

          <DropdownMenuItem
            icon={<Eye />}
            onClick={() => {
              close();
              onView(user);
            }}
          >
            View details
          </DropdownMenuItem>

          <DropdownMenuItem
            icon={<SquarePen />}
            onClick={() => {
              close();
              onEdit(user);
            }}
          >
            Edit user
          </DropdownMenuItem>

          <DropdownMenuItem
            icon={<KeyRound />}
            onClick={() => {
              close();
              onResetPassword(user);
            }}
          >
            Reset password
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Access</DropdownMenuLabel>

          {isActive ? (
            <>
              <DropdownMenuItem
                icon={<Lock />}
                onClick={() => {
                  close();
                  onLock(user);
                }}
              >
                Lock user
              </DropdownMenuItem>

              <DropdownMenuItem
                icon={<PauseCircle />}
                variant="destructive"
                onClick={() => {
                  close();
                  onSuspend(user);
                }}
              >
                Suspend user
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              icon={<PlayCircle />}
              onClick={() => {
                close();
                onActivate(user);
              }}
            >
              Activate user
            </DropdownMenuItem>
          )}
        </>
      )}
    </DropdownMenu>
  );
}
