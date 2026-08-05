import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Landmark } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { InlineAlert } from "@/components/common/InlineAlert";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useApiMutation } from "@/hooks/useApiMutation";
import { titleCase } from "@/lib/format";

import { glService } from "../services/glService";
import { createGlSchema, type CreateGlFormValues } from "../schema";
import {
  GlAccountCategory,
  GlAccountType,
  type CreateGlAccountRequest,
} from "../types";

const currencies = ["NGN", "USD", "GBP", "EUR"];

export default function CreateGlPage() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGlFormValues>({
    resolver: zodResolver(createGlSchema),
    defaultValues: {
      accountName: "",
      accountCode: "",
      accountType: "ASSET",
      category: "CURRENT",
      currency: "NGN",
      parentAccountCode: "",
      description: "",
      postingAllowed: true,
    },
  });

  const createAccount = useApiMutation<CreateGlAccountRequest, unknown>(
    (payload) => glService.create(payload),
    {
      onSuccess: () => {
        toast.success("GL account created.");
        reset();
      },
      onError: setFormError,
    },
  );

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const parsed = createGlSchema.parse(values);

    try {
      await createAccount.mutateAsync({
        accountName: parsed.accountName,
        accountCode: parsed.accountCode,
        accountType: parsed.accountType as CreateGlAccountRequest["accountType"],
        category: parsed.category as CreateGlAccountRequest["category"],
        currency: parsed.currency,
        parentAccountCode: parsed.parentAccountCode || undefined,
        description: parsed.description || undefined,
        postingAllowed: parsed.postingAllowed,
      });
    } catch {
      // Surfaced through formError by the onError callback.
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Create GL account"
        description="Open a new account on the general ledger."
      />

      <InlineAlert variant="info">
        This screen is ready for integration. The backend has no GL endpoint
        yet, so submissions are validated and acknowledged locally.
      </InlineAlert>

      {formError && <InlineAlert variant="error">{formError}</InlineAlert>}

      <SectionCard
        title="Account identity"
        description="How this account appears on the chart of accounts."
        action={
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="size-5" aria-hidden="true" />
          </span>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Account name"
            required
            error={errors.accountName?.message}
            className="sm:col-span-2"
          >
            {(props) => (
              <Input
                {...props}
                {...register("accountName")}
                placeholder="e.g. Cash and cash equivalents"
                className="h-10 border-neutral-300"
              />
            )}
          </FormField>

          <FormField
            label="Account code"
            required
            hint="4–10 digits. Must be unique."
            error={errors.accountCode?.message}
          >
            {(props) => (
              <Input
                {...props}
                {...register("accountCode")}
                inputMode="numeric"
                placeholder="e.g. 100201"
                className="h-10 border-neutral-300"
              />
            )}
          </FormField>

          <FormField
            label="Parent account code"
            hint="Leave blank for a top-level account."
            error={errors.parentAccountCode?.message}
          >
            {(props) => (
              <Input
                {...props}
                {...register("parentAccountCode")}
                inputMode="numeric"
                placeholder="e.g. 1002"
                className="h-10 border-neutral-300"
              />
            )}
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        title="Classification"
        description="Drives where the account lands in financial statements."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField
            label="Account type"
            required
            error={errors.accountType?.message}
          >
            {(props) => (
              <Select {...props} {...register("accountType")}>
                {Object.values(GlAccountType).map((value) => (
                  <option key={value} value={value}>
                    {titleCase(value)}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField
            label="Category"
            required
            error={errors.category?.message}
          >
            {(props) => (
              <Select {...props} {...register("category")}>
                {Object.values(GlAccountCategory).map((value) => (
                  <option key={value} value={value}>
                    {titleCase(value)}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField
            label="Currency"
            required
            error={errors.currency?.message}
          >
            {(props) => (
              <Select {...props} {...register("currency")}>
                {currencies.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        title="Posting rules"
        description="Control whether entries can be booked directly to this account."
      >
        <div className="space-y-5">
          <Controller
            name="postingAllowed"
            control={control}
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5"
                />

                <span>
                  <span className="block text-sm font-medium text-neutral-900">
                    Allow direct posting
                  </span>

                  <span className="block text-sm text-neutral-500">
                    Turn this off for header accounts that only roll up their
                    children.
                  </span>
                </span>
              </label>
            )}
          />

          <FormField
            label="Description"
            hint="Optional. Helps others understand what belongs here."
            error={errors.description?.message}
          >
            {(props) => (
              <Textarea
                {...props}
                {...register("description")}
                rows={3}
                placeholder="e.g. Petty cash held at branch level"
              />
            )}
          </FormField>
        </div>
      </SectionCard>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => reset()}
          disabled={createAccount.isPending}
        >
          Reset form
        </Button>

        <Button type="submit" size="lg" disabled={createAccount.isPending}>
          {createAccount.isPending && <Spinner />}
          Create account
        </Button>
      </div>
    </form>
  );
}
