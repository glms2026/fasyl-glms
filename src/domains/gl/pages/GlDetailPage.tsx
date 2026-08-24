import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Pencil,
  Tag,
  TreePine,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "@/components/common/SectionCard";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InlineAlert } from "@/components/common/InlineAlert";
import { FormField } from "@/components/common/FormField";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useAccess } from "@/domains/users/hooks/useAccess";
import { formatDateTime, titleCase } from "@/lib/format";

import { ModuleHeader } from "@/domains/users/components/ModuleHeader";
import {
  heroGhostButtonClass,
} from "@/domains/users/components/heroStyles";

import { GlTabs } from "../components/GlTabs";
import { glService } from "../services/glService";
import { updateGlSchema, type UpdateGlFormValues } from "../schema";
import type { LedgerResponse, LedgerStatus, UpdateLedgerRequest } from "../types";

/* ------------------------------------------------------------------ */
/*  Status badge                                                      */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<
  LedgerStatus,
  { badge: string; icon: typeof CheckCircle2 }
> = {
  PENDING: { badge: "bg-amber-50 text-amber-700 ring-amber-200", icon: Clock },
  PROCESSING: { badge: "bg-blue-50 text-blue-700 ring-blue-200", icon: Loader2 },
  SUBMITTED: { badge: "bg-indigo-50 text-indigo-700 ring-indigo-200", icon: CheckCircle2 },
  ACTIVE: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCircle2 },
  INACTIVE: { badge: "bg-neutral-100 text-neutral-600 ring-neutral-200", icon: FileText },
  SUSPENDED: { badge: "bg-red-50 text-red-700 ring-red-200", icon: FileText },
};

function StatusBadge({ status }: { status: LedgerStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.INACTIVE;
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${style.badge}`}
    >
      <Icon className="size-3.5" />
      {titleCase(status)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail row                                                        */
/* ------------------------------------------------------------------ */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function GlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const access = useAccess();

  const ledgerId = Number(id);
  const { data: ledger, isLoading, error, refetch } = useApiQuery(
    ["gl:detail", ledgerId].join(":"),
    () => glService.getById(ledgerId),
  );

  /* ---------- Edit mode ---------- */
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateGlFormValues>({
    resolver: zodResolver(updateGlSchema),
    values: ledger
      ? { ledgerType: ledger.ledgerType }
      : { ledgerType: "" },
  });

  const updateLedger = useApiMutation<UpdateLedgerRequest, LedgerResponse>(
    (payload) => glService.update(ledgerId, payload),
    {
      onSuccess: () => {
        toast.success("Ledger updated successfully.");
        setIsEditing(false);
        void refetch();
      },
    },
  );

  const onSubmitEdit = handleSubmit(async (values) => {
    const parsed = updateGlSchema.parse(values);
    await updateLedger.mutateAsync({ ledgerType: parsed.ledgerType });
  });

  /* ---------- Delete ---------- */
  const [showDelete, setShowDelete] = useState(false);

  const deleteLedger = useApiMutation<void, unknown>(
    () => glService.delete(ledgerId),
    {
      onSuccess: () => {
        toast.success("Ledger deleted successfully.");
        navigate("/gl/entries");
      },
    },
  );

  /* ---------- Error state ---------- */
  if (error) {
    return (
      <ErrorState
        title="Couldn't load this ledger"
        message={error}
        onRetry={refetch}
      />
    );
  }

  /* ---------- Loading state ---------- */
  if (isLoading || !ledger) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl lg:col-span-1" />
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const isActive = ledger.status === "ACTIVE";
  const canEdit = access.canMakeChanges && isActive;
  const canDelete = access.isAdmin;

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <ModuleHeader
        title={`${ledger.ledgerCode} — ${ledger.description}`}
        description={`${titleCase(ledger.ledgerType)} · ${ledger.leaf?.toUpperCase() === "Y" ? "Leaf" : "Header"} account`}
        eyebrow={
          <Link
            to="/gl/entries"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to entries
          </Link>
        }
        actions={
          <>
            {canEdit && !isEditing && (
              <Button
                size="lg"
                className={heroGhostButtonClass}
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            )}

            {canEdit && isEditing && (
              <Button
                size="lg"
                className={heroGhostButtonClass}
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            )}

            {canDelete && (
              <Button
                size="lg"
                className={heroGhostButtonClass}
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </>
        }
      />

      <GlTabs />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Info card */}
        <SectionCard className="lg:col-span-1">
          <div className="flex flex-col items-center gap-3 pb-5 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <BookOpen className="size-8" />
            </div>

            <div className="space-y-1">
              <p className="font-mono text-lg font-bold text-neutral-900">
                {ledger.ledgerCode}
              </p>
              <p className="text-sm text-neutral-500">{ledger.description}</p>
            </div>

            <StatusBadge status={ledger.status} />
          </div>

          <dl className="divide-y divide-neutral-100 border-t border-neutral-100">
            <DetailRow label="Ledger Code" value={ledger.ledgerCode} />
            <DetailRow label="Description" value={ledger.description} />
            <DetailRow label="Ledger Type" value={titleCase(ledger.ledgerType)} />

            <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-sm text-neutral-500">Leaf Account</dt>
              <dd>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ledger.leaf?.toUpperCase() === "Y"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {ledger.leaf?.toUpperCase() === "Y" ? (
                    <TreePine className="size-3" />
                  ) : (
                    <FileText className="size-3" />
                  )}
                  {ledger.leaf?.toUpperCase() === "Y" ? "Yes — Leaf" : "No — Header"}
                </span>
              </dd>
            </div>

            <DetailRow label="Status" value={titleCase(ledger.status)} />
            <DetailRow label="Created by" value={ledger.createdByUsername ?? "—"} />
            <DetailRow label="Created" value={formatDateTime(ledger.createdAt)} />
            <DetailRow label="Last updated" value={formatDateTime(ledger.updatedAt)} />
          </dl>
        </SectionCard>

        {/* Right: Edit form or info */}
        <SectionCard
          title={isEditing ? "Edit Ledger Type" : "Ledger Details"}
          description={
            isEditing
              ? "Update the ledger type for this account."
              : "Full information about this ledger account."
          }
          className="lg:col-span-2"
        >
          {isEditing ? (
            <form onSubmit={onSubmitEdit} className="space-y-6">
              {updateLedger.error && (
                <InlineAlert variant="error">
                  {typeof updateLedger.error === "string"
                    ? updateLedger.error
                    : "Failed to update ledger."}
                </InlineAlert>
              )}

              <FormField
                label="Ledger Type"
                required
                hint="2–150 characters."
                error={errors.ledgerType?.message}
              >
                {(props) => (
                  <div className="relative">
                    <Input
                      {...props}
                      {...register("ledgerType")}
                      placeholder="e.g. ASSET, LIABILITY, EQUITY"
                      maxLength={150}
                      className="h-11 pl-10 text-base transition-colors focus:border-indigo-400 focus:ring-indigo-100"
                    />
                    <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                  </div>
                )}
              </FormField>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    reset();
                  }}
                  disabled={updateLedger.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateLedger.isPending}>
                  {updateLedger.isPending && <Loader2 className="size-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-6">
                <h3 className="text-sm font-medium text-neutral-500 mb-3">About this account</h3>
                <p className="text-neutral-700 leading-relaxed">
                  This is a <strong>{titleCase(ledger.ledgerType)}</strong> type account
                  {ledger.leaf?.toUpperCase() === "Y"
                    ? " that allows direct postings (leaf account)."
                    : " that aggregates child accounts (header account)."}
                </p>
                <p className="text-neutral-500 text-sm mt-3">
                  Created by <strong>{ledger.createdByUsername ?? "—"}</strong> on{" "}
                  {formatDateTime(ledger.createdAt)}.
                  {ledger.updatedAt !== ledger.createdAt &&
                    ` Last updated ${formatDateTime(ledger.updatedAt)}.`}
                </p>
              </div>

              {!canEdit && !isActive && (
                <InlineAlert variant="info">
                  This ledger cannot be edited because its status is {titleCase(ledger.status)}.
                  {canDelete && " Only deletion is available."}
                </InlineAlert>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => {
          void deleteLedger.mutateAsync();
        }}
        title="Delete ledger account"
        description={`Are you sure you want to delete ledger "${ledger.ledgerCode} — ${ledger.description}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isPending={deleteLedger.isPending}
        error={deleteLedger.error ?? null}
        tone="destructive"
      />
    </div>
  );
}
