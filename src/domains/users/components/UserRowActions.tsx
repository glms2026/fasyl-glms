import {
  Eye,
  KeyRound,
  Lock,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  ShieldPlus,
  SquarePen,
  Trash2,
  Unlock,
  UserRoundX,
} from "lucide-react";
import { toast } from "sonner";

import { copyToClipboard } from "@/lib/clipboard";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  formatCredentials,
  getCreatedCredentials,
} from "../data/createdCredentials";
import { useAccess } from "../hooks/useAccess";
import type { ManagedUser } from "../types";

interface UserRowActionsProps {
  user: ManagedUser;
  onView: (user: ManagedUser) => void;
  onEdit: (user: ManagedUser) => void;
  onAssignRoles: (user: ManagedUser) => void;
  onLock: (user: ManagedUser) => void;
  onUnlock: (user: ManagedUser) => void;
  onSuspend: (user: ManagedUser) => void;
  onUnsuspend: (user: ManagedUser) => void;
  onDeactivate: (user: ManagedUser) => void;
  onActivate: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
}

export function UserRowActions({
  user,
  onView,
  onEdit,
  onAssignRoles,
  onLock,
  onUnlock,
  onSuspend,
  onUnsuspend,
  onDeactivate,
  onActivate,
  onDelete,
}: UserRowActionsProps) {
  const status = user.status;
  const access = useAccess();

  const credentials = getCreatedCredentials(user.id);

  // Temporary login credentials are a CONTROL-privilege: only users holding
  // the CONTROL role may copy them from the table (admins and authorizers
  // see no such action, even though they may manage the same accounts).
  const canCopyCredentials = Boolean(credentials) && access.isControl;

  const copyCredentials = async () => {
    if (!credentials) return;

    const copied = await copyToClipboard(formatCredentials(credentials));

    if (copied) {
      toast.success("Login credentials copied to clipboard.");
    } else {
      toast.error("Couldn't copy — your browser blocked clipboard access.");
    }
  };

  return (
    <DropdownMenu
      label={`Actions for ${user.firstName} ${user.lastName}`}
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

          {canCopyCredentials && (
            <DropdownMenuItem
              icon={<KeyRound />}
              onClick={() => {
                close();
                void copyCredentials();
              }}
            >
              Copy login credentials
            </DropdownMenuItem>
          )}

          {access.canMakeChanges && (
            <DropdownMenuItem
              icon={<SquarePen />}
              onClick={() => {
                close();
                onEdit(user);
              }}
            >
              Edit user
            </DropdownMenuItem>
          )}

          {access.canMakeChanges && (
            <DropdownMenuItem
              icon={<ShieldPlus />}
              onClick={() => {
                close();
                onAssignRoles(user);
              }}
            >
              Assign roles
            </DropdownMenuItem>
          )}

          {access.canAdminDirect && (
            <DropdownMenuItem
              icon={<Trash2 />}
              variant="destructive"
              onClick={() => {
                close();
                onDelete(user);
              }}
            >
              Delete user
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Access</DropdownMenuLabel>

          {status === "ACTIVE" && access.canMakeChanges && (
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
                onClick={() => {
                  close();
                  onSuspend(user);
                }}
              >
                Suspend user
              </DropdownMenuItem>

              <DropdownMenuItem
                icon={<UserRoundX />}
                variant="destructive"
                onClick={() => {
                  close();
                  onDeactivate(user);
                }}
              >
                Deactivate
              </DropdownMenuItem>
            </>
          )}

          {status === "LOCKED" && access.canAdminDirect && (
            <DropdownMenuItem
              icon={<Unlock />}
              onClick={() => {
                close();
                onUnlock(user);
              }}
            >
              Unlock account
            </DropdownMenuItem>
          )}

          {status === "SUSPENDED" && (
            <>
              {access.canMakeChanges && (
                <DropdownMenuItem
                  icon={<PlayCircle />}
                  onClick={() => {
                    close();
                    onUnsuspend(user);
                  }}
                >
                  Unsuspend
                </DropdownMenuItem>
              )}

              {access.canAdminDirect && (
                <DropdownMenuItem
                  icon={<PlayCircle />}
                  onClick={() => {
                    close();
                    onActivate(user);
                  }}
                >
                  Activate account
                </DropdownMenuItem>
              )}
            </>
          )}

          {(status === "INACTIVE" || status === "PASSWORD_EXPIRED") &&
            access.canAdminDirect && (
              <DropdownMenuItem
                icon={<PlayCircle />}
                onClick={() => {
                  close();
                  onActivate(user);
                }}
              >
                Activate account
              </DropdownMenuItem>
            )}
        </>
      )}
    </DropdownMenu>
  );
}
