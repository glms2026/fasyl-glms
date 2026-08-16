import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import { AssignRolesDialog } from "../components/AssignRolesDialog";
import { ReasonDialog } from "../components/ReasonDialog";
import { userFullName, type ManagedUser } from "../types";
import {
  useActivateUser,
  useAssignRoles,
  useDeactivateUser,
  useDeleteUser,
  useLockUser,
  useSuspendUser,
  useUnlockUser,
  useUnsuspendUser,
} from "./useUsers";

type ActionKind =
  | "lock"
  | "suspend"
  | "deactivate"
  | "unlock"
  | "unsuspend"
  | "activate"
  | "assignRoles"
  | "delete";

interface ActionTarget {
  kind: ActionKind;
  user: ManagedUser;
}

/**
 * Owns every per-user access action and the dialogs that confirm them, so the
 * directory and the detail screen behave identically without duplication.
 *
 * Approval reality: lock / suspend / unsuspend / deactivate / assign-roles
 * queue an approval request instead of acting immediately, so their success
 * toasts say "submitted for approval". Unlock / activate / delete are
 * ADMIN-only direct operations that take effect instantly.
 *
 * Render `dialogs` once inside the consuming screen.
 */
export function useUserActions() {
  const [target, setTarget] = useState<ActionTarget | null>(null);

  const close = () => setTarget(null);

  const lock = useLockUser({
    onSuccess: () => {
      toast.success("Lock request submitted for approval.");
      close();
    },
  });

  const suspend = useSuspendUser({
    onSuccess: () => {
      toast.success("Suspension request submitted for approval.");
      close();
    },
  });

  const deactivate = useDeactivateUser({
    onSuccess: () => {
      toast.success("Deactivation request submitted for approval.");
      close();
    },
  });

  const assignRoles = useAssignRoles({
    onSuccess: () => {
      toast.success("Role change submitted for approval.");
      close();
    },
  });

  const unlock = useUnlockUser({
    onSuccess: (message) => {
      toast.success(message || "Account unlocked.");
      close();
    },
  });

  const unsuspend = useUnsuspendUser({
    onSuccess: () => {
      toast.success("Unsuspension request submitted for approval.");
      close();
    },
  });

  const deleteUser = useDeleteUser({
    onSuccess: () => {
      toast.success("Account deleted.");
      close();
    },
  });

  const activate = useActivateUser({
    onSuccess: (message) => {
      toast.success(message || "Account activated.");
      close();
    },
  });

  const dialogs = (
    <>
      <ReasonDialog
        open={target?.kind === "lock"}
        title="Lock account"
        description={
          target
            ? `${userFullName(target.user)} won't be able to sign in until an authorizer approves and an administrator unlocks the account.`
            : undefined
        }
        confirmLabel="Submit lock request"
        onClose={close}
        isPending={lock.isPending}
        error={lock.error}
        onConfirm={(reason) => {
          if (!target) return;
          lock.mutate({ id: target.user.id, reason });
        }}
      />

      <ReasonDialog
        open={target?.kind === "suspend"}
        title="Suspend account"
        description={
          target
            ? `${userFullName(target.user)} will lose access once an authorizer approves the request.`
            : undefined
        }
        confirmLabel="Submit suspension request"
        tone="destructive"
        onClose={close}
        isPending={suspend.isPending}
        error={suspend.error}
        onConfirm={(reason) => {
          if (!target) return;
          suspend.mutate({ id: target.user.id, reason });
        }}
      />

      <ReasonDialog
        open={target?.kind === "deactivate"}
        title="Deactivate account"
        description={
          target
            ? `${userFullName(target.user)} keeps their profile but can't sign in until reactivated.`
            : undefined
        }
        confirmLabel="Submit deactivation request"
        onClose={close}
        isPending={deactivate.isPending}
        error={deactivate.error}
        onConfirm={(reason) => {
          if (!target) return;
          deactivate.mutate({ id: target.user.id, reason });
        }}
      />

      <AssignRolesDialog
        open={target?.kind === "assignRoles"}
        user={target?.user ?? null}
        onClose={close}
        isPending={assignRoles.isPending}
        error={assignRoles.error}
        onConfirm={(roles, reason) => {
          if (!target) return;
          assignRoles.mutate({ id: target.user.id, payload: { roles, reason } });
        }}
      />

      <ConfirmDialog
        open={target?.kind === "unlock"}
        onClose={close}
        onConfirm={() => {
          if (!target) return;
          unlock.mutate(target.user.id);
        }}
        title="Unlock account"
        description={
          target
            ? `${userFullName(target.user)} will be able to sign in again immediately.`
            : undefined
        }
        confirmLabel="Unlock"
        isPending={unlock.isPending}
        error={unlock.error}
      />

      <ReasonDialog
        open={target?.kind === "unsuspend"}
        title="Unsuspend account"
        description={
          target
            ? `An unsuspension request for ${userFullName(target.user)} will be queued for approval and takes effect once an authorizer approves it.`
            : undefined
        }
        confirmLabel="Submit unsuspension request"
        onClose={close}
        isPending={unsuspend.isPending}
        error={unsuspend.error}
        onConfirm={(reason) => {
          if (!target) return;
          unsuspend.mutate({ id: target.user.id, reason });
        }}
      />

      <ConfirmDialog
        open={target?.kind === "activate"}
        onClose={close}
        onConfirm={() => {
          if (!target) return;
          activate.mutate(target.user.id);
        }}
        title="Activate account"
        description={
          target
            ? `${userFullName(target.user)} will be able to sign in immediately.`
            : undefined
        }
        confirmLabel="Activate"
        isPending={activate.isPending}
        error={activate.error}
      />

      <ConfirmDialog
        open={target?.kind === "delete"}
        onClose={close}
        onConfirm={() => {
          if (!target) return;
          deleteUser.mutate(target.user.id);
        }}
        title="Delete user?"
        description={
          target
            ? `${userFullName(target.user)} will be removed immediately. This is an ADMIN action and can't be undone.`
            : undefined
        }
        confirmLabel="Delete user"
        tone="destructive"
        isPending={deleteUser.isPending}
        error={deleteUser.error}
      />
    </>
  );

  return {
    dialogs,
    openLock: (user: ManagedUser) => setTarget({ kind: "lock", user }),
    openSuspend: (user: ManagedUser) => setTarget({ kind: "suspend", user }),
    openDeactivate: (user: ManagedUser) => setTarget({ kind: "deactivate", user }),
    openUnlock: (user: ManagedUser) => setTarget({ kind: "unlock", user }),
    openUnsuspend: (user: ManagedUser) => setTarget({ kind: "unsuspend", user }),
    openActivate: (user: ManagedUser) => setTarget({ kind: "activate", user }),
    openAssignRoles: (user: ManagedUser) => setTarget({ kind: "assignRoles", user }),
    openDelete: (user: ManagedUser) => setTarget({ kind: "delete", user }),
  };
}
