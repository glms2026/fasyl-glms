import { z } from "zod";

export const createGlSchema = z.object({
  /** GL_CODE — 1-9 characters, not null. */
  accountCode: z
    .string()
    .trim()
    .min(1, "GL Code is required")
    .max(9, "GL Code must be 9 characters or fewer"),

  /** GL_DESC — max 150 characters. */
  accountName: z
    .string()
    .trim()
    .min(1, "GL Description is required")
    .max(150, "GL Description must be 150 characters or fewer"),

  /** GL_TYPE — max 30 characters. */
  accountType: z
    .string()
    .trim()
    .min(1, "GL Type is required")
    .max(30, "GL Type must be 30 characters or fewer"),

  /** LEAF — "Y" or "N". */
  leaf: z
    .string()
    .trim()
    .min(1, "Leaf status is required")
    .max(1, "Must be Y or N"),
});

export type CreateGlFormValues = z.input<typeof createGlSchema>;
export type CreateGlParsedValues = z.output<typeof createGlSchema>;
