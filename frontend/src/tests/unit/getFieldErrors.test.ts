import { getFieldErrors } from "../../utils/getFieldErrors";
import { describe, it, expect } from "vitest";

const errors = [
  {
    path: "password",
    msg: "Password is required",
    location: "body",
    type: "field",
  },
  {
    path: "password",
    msg: "Password must be at least 8 characters long",
    location: "body",
    type: "field",
  },
  {
    path: "name",
    msg: "Name is required",
    location: "body",
    type: "field",
  },
];

describe("getFieldErrors", () => {
  it("returns undefined when errors is undefined", () => {
    const result = getFieldErrors("email", undefined);
    expect(result).toBeUndefined();
  });

  it("returns undefined when no errors match the field name", () => {
    const result = getFieldErrors("email", errors);
    expect(result).toBeUndefined();
  });

  it("returns array of message strings for matching field errors", () => {
    const result = getFieldErrors("password", errors);
    expect(result).toEqual([
      "Password is required",
      "Password must be at least 8 characters long",
    ]);
  });

  it("filters correctly when multiple fields have errors", () => {
    const result = getFieldErrors("name", errors);
    expect(result).toEqual(["Name is required"]);
  });
});
