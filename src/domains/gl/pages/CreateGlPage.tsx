import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  BookOpen,
  Hash,
  Loader2,
  Tag,
  TreePine,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";
import { SectionCard } from "@/components/common/SectionCard";

import { ModuleHeader } from "@/domains/users/components/ModuleHeader";

import { GlTabs } from "../components/GlTabs";
import { LedgerCodePicker } from "../components/LedgerCodePicker";

import { glService } from "../services/glService";
import { createGlSchema, type CreateGlFormValues } from "../schema";
import type { CreateLedgerRequest, LedgerReference } from "../types";

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function CreateGlPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateCodeError, setDuplicateCodeError] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<LedgerReference | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError: setFieldError,
    formState: { errors },
  } = useForm<CreateGlFormValues>({
    resolver: zodResolver(createGlSchema),
    defaultValues: {
      ledgerCode: "",
      description: "",
      ledgerType: "",
      leaf: "",
    },
  });

  /* ---------- Handle code selection from dropdown ---------- */
  const handleCodeChange = useCallback(
    async (code: string, ref: LedgerReference | null) => {
      setDuplicateCodeError(null);
      setFormError(null);
      setSelectedRef(ref);

      if (!code || !ref) {
        // Clear everything
        setValue("ledgerCode", "", { shouldValidate: true });
        setValue("description", "", { shouldValidate: true });
        setValue("leaf", "", { shouldValidate: true });
        return;
      }

      // Set the code
      setValue("ledgerCode", code, { shouldValidate: true });

      // Check for duplicate first
      try {
        const page = await glService.searchAll(code, { page: 0, size: 10 });
        const exactMatch = page.content?.some(
          (l) => l.ledgerCode?.trim() === code,
        );
        if (exactMatch) {
          setDuplicateCodeError(
            "A ledger with this code already exists — please try a different code.",
          );
          // Don't populate fields if duplicate
          setValue("description", "", { shouldValidate: true });
          setValue("leaf", "", { shouldValidate: true });
          return;
        }
      } catch {
        // Best-effort check
      }

      // No duplicate — populate from reference
      setValue("description", ref.glDesc ?? "", { shouldValidate: true });
      setValue(
        "leaf",
        ref.leaf?.toUpperCase() === "Y" ? "Y" : "N",
        { shouldValidate: true },
      );
    },
    [setValue],
  );

  /* ---------- Submit ---------- */
  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setIsSubmitting(true);
    const parsed = createGlSchema.parse(values);

    try {
      const payload: CreateLedgerRequest = {
        ledgerCode: parsed.ledgerCode,
        description: parsed.description,
        ledgerType: parsed.ledgerType,
        leaf: parsed.leaf,
      };

      // eslint-disable-next-line no-console
      console.log("[GL] Submit payload:", JSON.stringify(payload));

      await glService.create(payload);

      toast.success("Ledger account created successfully.");
      reset();
      setDuplicateCodeError(null);
      setSelectedRef(null);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = axiosErr.response?.status;
      const message = axiosErr.response?.data?.message ?? "";

      if (status === 409 || message.toLowerCase().includes("already exist")) {
        const duplicateMsg =
          "A ledger with this code already exists — please try a different code.";
        setFieldError("ledgerCode", { type: "server", message: duplicateMsg });
        toast.error(duplicateMsg);
      } else {
        setFormError(
          message ||
            "Something went wrong on our side — please try again in a moment.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleReset = () => {
    reset();
    setFormError(null);
    setDuplicateCodeError(null);
    setSelectedRef(null);
  };

  /* ---------- Field styling ---------- */
  const populatedCls =
    "border-emerald-200 bg-emerald-50/50 text-emerald-800 cursor-default";
  const editableCls =
    "border-neutral-300 focus:border-indigo-400 focus:ring-indigo-100";

  const hasSelectedCode = !!selectedRef && !duplicateCodeError;
  const isDisabled =
    isSubmitting || !!duplicateCodeError;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ModuleHeader
        title="Create Ledger Account"
        description="Register a new account on the general ledger."
      />

      <GlTabs />

      {formError && <InlineAlert variant="error">{formError}</InlineAlert>}

      {/* ===== STEP 1 — Ledger Code dropdown ===== */}
      <SectionCard
        title="Ledger Code"
        description="Select a chart-of-accounts code from the reference table. Description and Leaf will auto-fill."
        action={
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Hash className="size-5" aria-hidden="true" />
          </span>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Ledger Code"
            required
            hint="Search and select from the reference table."
            error={errors.ledgerCode?.message || duplicateCodeError || undefined}
          >
            {() => (
              <LedgerCodePicker
                value={selectedRef?.glCode ?? ""}
                onChange={handleCodeChange}
                disabled={isSubmitting}
                error={errors.ledgerCode?.message || duplicateCodeError || undefined}
              />
            )}
          </FormField>

          {/* Status feedback */}
          {hasSelectedCode && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                ✓
              </span>
              <span>
                <span className="font-semibold">{selectedRef?.glCode}</span> selected — fields auto-populated below
              </span>
            </div>
          )}

          {duplicateCodeError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                ✕
              </span>
              {duplicateCodeError}
            </div>
          )}

          {isSubmitting && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="size-4 animate-spin" />
              Checking for duplicates…
            </div>
          )}
        </div>
      </SectionCard>

      {/* ===== STEP 2 — Account Details ===== */}
      <SectionCard
        title="Account Details"
        description={
          hasSelectedCode
            ? "Pre-filled from the reference table. Review and submit."
            : duplicateCodeError
              ? "Fix the duplicate code above before filling in details."
              : "Select a ledger code above to auto-fill Description and Leaf. Ledger Type is entered manually."
        }
        action={
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <BookOpen className="size-5" aria-hidden="true" />
          </span>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Ledger Code (read-only display) */}
          <FormField
            label="Selected Code"
            hint="Chosen from the dropdown above."
            className="sm:col-span-2"
          >
            {() => (
              <Input
                value={selectedRef?.glCode ?? ""}
                readOnly
                placeholder="No code selected"
                className={`h-11 pl-10 text-base font-mono tracking-wider ${selectedRef ? populatedCls : "border-neutral-200 bg-neutral-50 text-neutral-400"}`}
              />
            )}
          </FormField>

          {/* Description (GL_DESC) — auto-populated */}
          <FormField
            label="Ledger Description"
            required
            hint="Auto-populated from the reference table."
            error={errors.description?.message}
            className="sm:col-span-2"
          >
            {() => (
              <Input
                {...register("description")}
                readOnly={hasSelectedCode}
                placeholder="Auto-populated from reference"
                maxLength={500}
                className={`h-11 pl-10 text-base transition-colors ${
                  hasSelectedCode ? populatedCls : editableCls
                }`}
              />
            )}
          </FormField>

          {/* Ledger Type (GL_TYPE) — always editable */}
          <FormField
            label="Ledger Type"
            required
            hint="2–150 characters. e.g. ASSET, LIABILITY, EQUITY, INCOME, EXPENSE"
            error={errors.ledgerType?.message}
          >
            {() => (
              <div className="relative">
                <Input
                  {...register("ledgerType")}
                  placeholder="e.g. ASSET, LIABILITY"
                  maxLength={150}
                  disabled={isDisabled}
                  className="h-11 pl-10 text-base font-medium uppercase tracking-wide transition-colors focus:border-indigo-400 focus:ring-indigo-100"
                />
                <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              </div>
            )}
          </FormField>

          {/* Leaf (LEAF) — auto-populated */}
          <FormField
            label="Leaf Account"
            required
            hint="Auto-populated. Y = leaf (postings allowed), N = header."
            error={errors.leaf?.message}
          >
            {() => (
              <div className="relative">
                <Input
                  {...register("leaf")}
                  readOnly={hasSelectedCode}
                  placeholder="Auto-populated"
                  maxLength={1}
                  className={`h-11 pl-10 text-base font-medium uppercase tracking-wide transition-colors ${
                    hasSelectedCode ? populatedCls : editableCls
                  }`}
                />
                <TreePine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              </div>
            )}
          </FormField>
        </div>
      </SectionCard>

      {/* Action bar */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          Reset
        </Button>

        <Button
          type="submit"
          size="lg"
          disabled={
            isSubmitting || !hasSelectedCode || !!duplicateCodeError
          }
        >
          {isSubmitting && <Spinner />}
          Create Ledger Account
        </Button>
      </div>
    </form>
  );
}
