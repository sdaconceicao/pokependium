import { validateNewPassword } from "./validation";

describe("validateNewPassword", () => {
  const VALID = "Pikachu123!";

  it("returns no errors for a valid, matching pair", () => {
    expect(validateNewPassword(VALID, VALID)).toEqual({});
  });

  it("requires a password", () => {
    expect(validateNewPassword("", "")).toEqual({
      password: "Password is required",
      confirmPassword: "Please confirm your password",
    });
  });

  it("surfaces only the first policy error", () => {
    const result = validateNewPassword("weak", "weak");

    expect(result.password).toBe("Password must be at least 8 characters long");
    expect(result.confirmPassword).toBeUndefined();
  });

  it("requires a confirmation even when the password is valid", () => {
    expect(validateNewPassword(VALID, "")).toEqual({
      confirmPassword: "Please confirm your password",
    });
  });

  it("reports a mismatch against the confirmation field", () => {
    expect(validateNewPassword(VALID, "Pikachu456!")).toEqual({
      confirmPassword: "Passwords do not match",
    });
  });

  it("treats a policy failure and a mismatch as separate fields", () => {
    expect(validateNewPassword("weak", "different")).toEqual({
      password: "Password must be at least 8 characters long",
      confirmPassword: "Passwords do not match",
    });
  });

  it("is pure — repeated calls agree and inputs are untouched", () => {
    const password = VALID;

    expect(validateNewPassword(password, password)).toEqual(
      validateNewPassword(password, password),
    );
    expect(password).toBe(VALID);
  });
});
