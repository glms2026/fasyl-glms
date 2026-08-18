import { describe, expect, it } from "vitest";

import { createUserSchema } from "./schema";

const valid = {
  firstName: "Ada",
  lastName: "Lovelace",
  username: "alovelace",
  email: "ada@fasyl.com",
  password: "Temp@1234",
  roles: ["CREATOR"],
  permissions: ["LEDGER_CREATE"],
  reason: "New finance starter joining in September",
};

describe("createUserSchema", () => {
  it("accepts a user without the ADMIN role", () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects the ADMIN role, which the backend will never approve", () => {
    const result = createUserSchema.safeParse({
      ...valid,
      roles: ["ADMIN"],
      permissions: ["USER_CREATE"],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const issue = result.error.issues.find(
        (candidate) => candidate.path[0] === "roles",
      );

      expect(issue).toBeDefined();
      expect(issue?.message).toMatch(
        /Administrator accounts are provisioned directly/i,
      );
    }
  });

  it("rejects the ADMIN role even when it's typed in lowercase", () => {
    const result = createUserSchema.safeParse({
      ...valid,
      roles: ["creator", "admin"],
    });

    expect(result.success).toBe(false);
  });
});
