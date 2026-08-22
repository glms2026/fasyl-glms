import { useCallback, useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Hash,
  Loader2,
  Search,
  Tag,
  TreePine,
  Type,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";
import { SectionCard } from "@/components/common/SectionCard";
import { useApiMutation } from "@/hooks/useApiMutation";

import { ModuleHeader } from "@/domains/users/components/ModuleHeader";

import { GlTabs } from "../components/GlTabs";

import { glService } from "../services/glService";
import { createGlSchema, type CreateGlFormValues } from "../schema";
import type { CreateGlAccountRequest, GlCodeLookupResponse } from "../types";

/* ------------------------------------------------------------------ */
/*  Lookup status badge                                               */
/* ------------------------------------------------------------------ */

type LookupStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found"; data: GlCodeLookupResponse }
  | { state: "not-found" }
  | { state: "error"; message: string };

function LookupBadge({ status }: { status: LookupStatus }) {
  switch (status.state) {
    case "loading":
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="size-4 animate-spin" />
          Looking up…
        </div>
      );
    case "found":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-4 shrink-0" />
          Matched — fields auto-populated
        </div>
      );
    case "not-found":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-amber-200">
          <AlertCircle className="size-4 shrink-0" />
          Code not found in the reference table
        </div>
      );
    case "error":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          <AlertCircle className="size-4 shrink-0" />
          {status.message}
        </div>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function CreateGlPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>({ state: "idle" });
  const [fieldsPopulated, setFieldsPopulated] = useState(false);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateGlFormValues>({
    resolver: zodResolver(createGlSchema),
    defaultValues: {
      accountCode: "",
      accountName: "",
      accountType: "",
      leaf: "",
    },
  });

  const glCode = watch("accountCode");
  const isPopulated = lookupStatus.state === "found" || fieldsPopulated;

  /* ---------- GL_CODE lookup with debounce ---------- */
  const performLookup = useCallback(
    async (code: string) => {
      const trimmed = code.trim();

      if (trimmed.length < 2) {
        setLookupStatus({ state: "idle" });
        return;
      }

      setLookupStatus({ state: "loading" });

      try {
        const result = await glService.lookupByCode(trimmed);

        if (!result) {
          setLookupStatus({ state: "not-found" });
          setFieldsPopulated(false);
          return;
        }

        setValue("accountName", result.accountName, { shouldValidate: true });
        setValue("accountType", result.accountType, { shouldValidate: true });
        setValue("leaf", result.leaf?.toUpperCase() === "Y" ? "Y" : "N", { shouldValidate: true });
        setFieldsPopulated(true);
        setLookupStatus({ state: "found", data: result });
      } catch (err) {
        setLookupStatus({
          state: "error",
          message: err instanceof Error ? err.message : "Lookup failed.",
        });
      }
    },
    [setValue],
  );

  useEffect(() => {
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);

    if (!glCode || glCode.trim().length < 2) {
      setLookupStatus({ state: "idle" });
      setFieldsPopulated(false);
      return;
    }

    lookupTimerRef.current = setTimeout(() => {
      void performLookup(glCode);
    }, 400);

    return () => {
      if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    };
  }, [glCode, performLookup]);

  /* ---------- Submit ---------- */
  const createAccount = useApiMutation<CreateGlAccountRequest, unknown>(
    (payload) => glService.create(payload),
    {
      onSuccess: () => {
        toast.success("GL account created successfully.");
        reset();
        setLookupStatus({ state: "idle" });
        setFieldsPopulated(false);
      },
      onError: setFormError,
    },
  );

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const parsed = createGlSchema.parse(values);

    try {
      await createAccount.mutateAsync({
        accountCode: parsed.accountCode,
        accountName: parsed.accountName,
        accountType: parsed.accountType,
        leaf: parsed.leaf,
      });
    } catch {
      // Surfaced through formError by the onError callback.
    }
  });

  const handleReset = () => {
    reset();
    setLookupStatus({ state: "idle" });
    setFieldsPopulated(false);
    setFormError(null);
  };

  /* ---------- Field styling ---------- */
  const populatedCls = "border-emerald-200 bg-emerald-50/50 text-emerald-800 cursor-default";
  const editableCls = "border-neutral-300 focus:border-indigo-400 focus:ring-indigo-100";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ModuleHeader
        title="Create GL Account"
        description="Register a new account on the general ledger."
      />

      <GlTabs />

      {formError && <InlineAlert variant="error">{formError}</InlineAlert>}

      {/* ===== STEP 1 — GL Code lookup ===== */}
      <SectionCard
        title="GL Code"
        description="Enter the chart-of-accounts code. The system will look it up and auto-fill the remaining fields."
        action={
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Hash className="size-5" aria-hidden="true" />
          </span>
        }
      >
        <div className="space-y-4">
          <FormField
            label="GL Code"
            required
            hint="1–9 characters. Checked against the reference table."
            error={errors.accountCode?.message}
          >
            {(props) => (
              <div className="relative">
                <Input
                  {...props}
                  {...register("accountCode")}
                  placeholder="e.g. 100100100"
                  maxLength={9}
                  className="h-11 border-neutral-300 pl-10 text-base font-mono tracking-wider transition-colors focus:border-indigo-400 focus:ring-indigo-100"
                  autoComplete="off"
                  spellCheck={false}
                />
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              </div>
            )}
          </FormField>

          <LookupBadge status={lookupStatus} />
        </div>
      </SectionCard>

      {/* ===== STEP 2 — Account Details ===== */}
      <SectionCard
          title="Account Details"
          description={
            isPopulated
              ? "Pre-filled from the reference table. Review and submit."
              : lookupStatus.state === "not-found"
                ? "GL Code not found. Enter details manually."
                : "Fields will be auto-populated after GL Code lookup."
          }
          action={
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
          }
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {/* GL_DESC */}
            <FormField
              label="GL Description"
              required
              hint="Max 150 characters."
              error={errors.accountName?.message}
              className="sm:col-span-2"
            >
              {(props) => (
                <div className="relative">
                  <Input
                    {...props}
                    {...register("accountName")}
                    placeholder={isPopulated ? "" : "Auto-populated after GL Code lookup"}
                    maxLength={150}
                    readOnly={isPopulated}
                    className={`h-11 pl-10 text-base transition-colors ${isPopulated ? populatedCls : editableCls}`}
                  />
                  <Type className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                </div>
              )}
            </FormField>

            {/* GL_TYPE */}
            <FormField
              label="GL Type"
              required
              hint="Max 30 characters."
              error={errors.accountType?.message}
            >
              {(props) => (
                <div className="relative">
                  <Input
                    {...props}
                    {...register("accountType")}
                    placeholder={isPopulated ? "" : "Auto-populated after GL Code lookup"}
                    maxLength={30}
                    readOnly={isPopulated}
                    className={`h-11 pl-10 text-base font-medium uppercase tracking-wide transition-colors ${isPopulated ? populatedCls : editableCls}`}
                  />
                  <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                </div>
              )}
            </FormField>

            {/* LEAF */}
            <FormField
              label="Leaf Account"
              required
              hint="Y = leaf (postings allowed), N = header (rolls up children)."
              error={errors.leaf?.message}
            >
              {(props) => (
                <div className="relative">
                  <Input
                    {...props}
                    {...register("leaf")}
                    placeholder={isPopulated ? "" : "Auto-populated after GL Code lookup"}
                    maxLength={1}
                    readOnly={isPopulated}
                    className={`h-11 pl-10 text-base font-medium uppercase tracking-wide transition-colors ${isPopulated ? populatedCls : editableCls}`}
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
          disabled={createAccount.isPending}
        >
          Reset
        </Button>

        <Button
          type="submit"
          size="lg"
          disabled={
            createAccount.isPending ||
            lookupStatus.state === "loading" ||
            lookupStatus.state === "not-found"
          }
        >
          {createAccount.isPending && <Spinner />}
          Create GL Account
        </Button>
      </div>
    </form>
  );
}
