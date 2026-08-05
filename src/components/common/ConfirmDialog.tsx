import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";

import { InlineAlert } from "./InlineAlert";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  /** Extra inputs, e.g. an optional reason field. */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  error?: string | null;
  tone?: "default" | "destructive";
}

/** Confirmation prompt shared by every destructive or state-changing action. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isPending = false,
  error = null,
  tone = "default",
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      busy={isPending}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {cancelLabel}
          </Button>

          <Button
            variant={tone === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Spinner />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <InlineAlert variant="error">{error}</InlineAlert>}
        {children}
      </div>
    </Modal>
  );
}
