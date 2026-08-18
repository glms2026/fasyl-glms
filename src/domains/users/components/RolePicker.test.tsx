import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { RolePicker } from "./RolePicker";

afterEach(cleanup);

describe("RolePicker", () => {
  it("hides excluded roles from the suggestions", () => {
    render(
      <RolePicker
        value={[]}
        onChange={() => {}}
        suggestions={["ADMIN", "CONTROL", "CREATOR"]}
        exclude={["ADMIN"]}
      />,
    );

    expect(screen.queryByRole("button", { name: "ADMIN" })).toBeNull();
    expect(screen.getByRole("button", { name: "CONTROL" })).toBeDefined();
    expect(screen.getByRole("button", { name: "CREATOR" })).toBeDefined();
  });

  it("refuses to add an excluded role typed by the user", () => {
    const onChange = vi.fn();

    render(
      <RolePicker
        value={[]}
        onChange={onChange}
        suggestions={[]}
        exclude={["admin"]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/type a role name/i), {
      target: { value: "ADMIN" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("still allows roles that aren't excluded", () => {
    const onChange = vi.fn();

    render(
      <RolePicker
        value={[]}
        onChange={onChange}
        suggestions={[]}
        exclude={["ADMIN"]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/type a role name/i), {
      target: { value: "CREATOR" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(onChange).toHaveBeenCalledWith(["CREATOR"]);
  });

  it("gives each selected role pill a distinct colour", () => {
    render(
      <RolePicker
        value={["ADMIN", "CONTROL", "CREATOR"]}
        onChange={() => {}}
        suggestions={[]}
      />,
    );

    const pillFor = (role: string) =>
      screen.getByText(role).closest("span");

    expect(pillFor("ADMIN")?.className).toContain("bg-red-50");
    expect(pillFor("CONTROL")?.className).toContain("bg-sky-50");
    expect(pillFor("CREATOR")?.className).toContain("bg-emerald-50");

    // Three roles, three different pill colours.
    const classes = ["ADMIN", "CONTROL", "CREATOR"].map(
      (role) => pillFor(role)?.className,
    );
    expect(new Set(classes).size).toBe(3);
  });
});
