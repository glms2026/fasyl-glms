import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import { LockUserDialog } from "../components/LockUserDialog";
import { SuspendUserDialog } from "../components/SuspendUserDialog";
import type { ManagedUser } from "../types";
import {
  useActivateUser,
  useLockUser,
  useResetUserPassword,
  useSuspendUser,
} from "./useUsers";

type ActionKind = "lock" | "suspend" | "activate" | "reset";

interface ActionTarget {
  kind: ActionKind;
  user: ManagedUser;
}

/**
 * Owns every per-user access action and the dialogs that confirm them, so the
 * directory and the detail screen behave identically without duplication.
 *
 * Render `dialogs` once inside the consuming screen.
 */
export function useUserActions() {
  const [target, setTarget] = useState<ActionTarget | null>(null);

  const close = () => setTarget(null);

  const lock = useLockUser({
    onSuccess: (user) => {
      toast.success(`${user.fullName} is locked out.`);
      close();
    },
  });

  const suspend = useSuspendUser({
    onSuccess: (user) => {
      toast.success(`${user.fullName} has been suspended.`);
      close();
    },
  });

  const activate = useActivateUser({
    onSuccess: (user) => {
      toast.success(`${user.fullName} is active again.`);
      close();
    },
  });

  const resetPassword = useResetUserPassword({
    onSuccess: (message) => {
      toast.success(message);
      close();
    },
  });

  const dialogs = (
    <>
      <LockUserDialog
        open={target?.kind === "lock"}
        user={target?.user ?? null}
        onClose={close}
        isPending={lock.isPending}
        error={lock.error}
        onConfirm={(durationMinutes) => {
          if (!target) return;
          lock.mutate({ id: target.user.id, durationMinutes });
        }}
      />

      <SuspendUserDialog
        open={target?.kind === "suspend"}
        user={target?.user ?? null}
        onClose={close}
        isPending={suspend.isPending}
        error={suspend.error}
        onConfirm={(reason) => {
          if (!target) return;
          suspend.mutate({ id: target.user.id, reason });
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
            ? `${target.user.fullName} will be able to sign in immediately.`
            : undefined
        }
        confirmLabel="Activate"
        isPending={activate.isPending}
        error={activate.error}
      />

      <ConfirmDialog
        open={target?.kind === "reset"}
        onClose={close}
        onConfirm={() => {
          if (!target) return;
          resetPassword.mutate(target.user.id);
        }}
        title="Send a password reset?"
        description={
          target
            ? `A reset link will be emailed to ${target.user.email}.`
            : undefined
        }
        confirmLabel="Send reset link"
        isPending={resetPassword.isPending}
        error={resetPassword.error}
      />
    </>
  );

  return {
    dialogs,
    openLock: (user: ManagedUser) => setTarget({ kind: "lock", user }),
    openSuspend: (user: ManagedUser) => setTarget({ kind: "suspend", user }),
    openActivate: (user: ManagedUser) => setTarget({ kind: "activate", user }),
    openResetPassword: (user: ManagedUser) =>
      setTarget({ kind: "reset", user }),
  };
}
