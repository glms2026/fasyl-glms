import { useState } from "react";
import {
  Eye,
  KeyRound,
  Lock,
  Mail,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  ShieldPlus,
  SquarePen,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { copyToClipboard } from "@/lib/clipboard";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";

import { useAuthStore } from "@/domains/auth/stores/authStore";

import {
  buildCredentialsEmail,
  buildGmailComposeUrl,
  formatCredentials,
  getCreatedCredentials,
  type CredentialEmail,
} from "../data/createdCredentials";
import { useAccess } from "../hooks/useAccess";
import type { ManagedUser } from "../types";

interface UserRowActionsProps {
  user: ManagedUser;
  onView: (user: ManagedUser) => void;
  onEdit: (user: ManagedUser) => void;
  onAssignRoles: (user: ManagedUser) => void;
  onLock: (user: ManagedUser) => void;
  onSuspend: (user: ManagedUser) => void;
  onUnsuspend: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
}

export function UserRowActions({
  user,
  onView,
  onEdit,
  onAssignRoles,
  onLock,
  onSuspend,
  onUnsuspend,
  onDelete,
}: UserRowActionsProps) {
  const status = user.status;
  const access = useAccess();

  const credentials = getCreatedCredentials(user.id);

  // Rejected users cannot be modified or have credentials delivered.
  const isRejected = status === "REJECTED";
  // Deleted users are immutable.
  const isDeleted = status === "DELETED";
  // Pending/inactive users awaiting approval.
  const isInactive = status === "INACTIVE";
  // Any terminal or immutable state.
  const isImmutable = isRejected || isDeleted || isInactive;

  // Temporary login credentials are a CONTROL-privilege: only users holding
  // the CONTROL role may email them (admins and authorizers see no such
  // action, even though they may manage the same accounts).
  const canEmailCredentials = Boolean(credentials) && access.isControl && !isImmutable;

  // The drafted email is shown in a confirmation dialog before anything
  // opens, so the CONTROL user can verify the recipient and the temporary
  // password they're about to hand out.
  const [emailDraft, setEmailDraft] = useState<CredentialEmail | null>(null);

  const prepareEmail = () => {
    if (!credentials) return;

    const sender = useAuthStore.getState().user;

    setEmailDraft(
      buildCredentialsEmail(
        user,
        credentials,
        // The recipient sees who issued the account, not an anonymous role.
        sender?.username ?? "System Administrator",
        `${window.location.origin}/login`,
      ),
    );
  };

  const sendEmail = () => {
    if (!emailDraft) return;

    window.open(buildGmailComposeUrl(emailDraft), "_blank");
    setEmailDraft(null);
  };

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
    <>
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

          {canEmailCredentials && (
            <DropdownMenuItem
              icon={<Mail />}
              onClick={() => {
                close();
                prepareEmail();
              }}
            >
              Email login credentials
            </DropdownMenuItem>
          )}

          {canEmailCredentials && (
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

          {access.canMakeChanges && !isImmutable && (
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

          {access.canMakeChanges && !isImmutable && (
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

          {access.canMakeChanges && !isImmutable && (
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

          {(status === "ACTIVE" && access.canMakeChanges) ||
          (status === "SUSPENDED" && access.canMakeChanges) ? (
            <>
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
                </>
              )}

              {status === "SUSPENDED" && access.canMakeChanges && (
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
            </>
          ) : null}
        </>
      )}
    </DropdownMenu>

    <Modal
      open={emailDraft !== null}
      onClose={() => setEmailDraft(null)}
      title="Email login credentials"
      description="A Gmail compose window will open pre-filled with the message below. Nothing is sent until you press send in Gmail."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => setEmailDraft(null)}>
            Cancel
          </Button>

          <Button onClick={sendEmail}>Open Gmail compose</Button>
        </>
      }
    >
      {emailDraft && (
        <div className="space-y-4">
          <div className="space-y-1 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
            <p className="truncate">
              <span className="font-medium text-neutral-900">To: </span>
              <span className="text-neutral-600">{emailDraft.to}</span>
            </p>

            <p className="truncate">
              <span className="font-medium text-neutral-900">Subject: </span>
              <span className="text-neutral-600">{emailDraft.subject}</span>
            </p>
          </div>

          <div className="whitespace-pre-wrap rounded-lg border border-neutral-200 px-4 py-3 text-sm leading-relaxed text-neutral-700">
            {emailDraft.body}
          </div>
        </div>
      )}
    </Modal>
    </>
  );
}
