import { z } from "zod";

export const createGlSchema = z.object({
  /** ledgerCode — numeric only, 2-30 characters. */
  ledgerCode: z
    .string()
    .trim()
    .min(2, "Ledger Code must be at least 2 digits")
    .max(30, "Ledger Code must be 30 digits or fewer")
    .regex(/^[0-9]+$/, "Ledger Code must contain only digits"),

  /** description — required, max 500 characters. */
  description: z
    .string()
    .trim()
    .min(1, "Ledger Description is required")
    .max(500, "Ledger Description must be 500 characters or fewer"),

  /** ledgerType — required, 2-150 characters. */
  ledgerType: z
    .string()
    .trim()
    .min(2, "Ledger Type must be at least 2 characters")
    .max(150, "Ledger Type must be 150 characters or fewer"),

  /** leaf — required, exactly 1 character. */
  leaf: z
    .string()
    .trim()
    .min(1, "Leaf status is required")
    .max(1, "Must be Y or N"),
});

/** Schema for updating a ledger (only ledgerType is editable). */
export const updateGlSchema = z.object({
  ledgerType: z
    .string()
    .trim()
    .min(2, "GL Type must be at least 2 characters")
    .max(150, "GL Type must be 150 characters or fewer"),
});

export type CreateGlFormValues = z.input<typeof createGlSchema>;
export type CreateGlParsedValues = z.output<typeof createGlSchema>;
export type UpdateGlFormValues = z.input<typeof updateGlSchema>;
