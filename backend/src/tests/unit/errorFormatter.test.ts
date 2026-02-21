import { describe, it, expect } from "vitest";
import { createFieldError } from "../../utils/errorFormatter.js";

// Unit tests for the createFieldError function
describe("createFieldError()", () => {
  // Test case to verify that the function creates a field error object correctly
  it("should create a field error object", () => {
    // Define the input parameters for the test case
    const field = "email";
    const message = "Invalid email address";

    // Define the expected result based on the input parameters
    const expectedResult = {
      type: "field",
      msg: message,
      path: field,
      location: "body",
    };

    // Call the function and store the result
    const result = createFieldError(field, message);

    // Assert that the result matches the expected result
    expect(result).toEqual(expectedResult);
  });

  // Only one test needed — no branching logic, behavior is identical for any string input.
});
