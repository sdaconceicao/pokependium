import type { User } from "@/types";
import { resolveAccountProfileState } from "./AccountProfile.utils";

const USER: User = {
  id: "user-123",
  email: "ash@pallet.town",
  username: "ash@pallet.town",
  firstName: "",
  lastName: "",
};

describe("resolveAccountProfileState", () => {
  it("reports loading while auth is resolving", () => {
    expect(resolveAccountProfileState(true, undefined, null)).toBe("loading");
  });

  it("prefers loading over a missing user and an error", () => {
    expect(resolveAccountProfileState(true, undefined, new Error("boom"))).toBe("loading");
  });

  it("reports signed out once auth settles with no user", () => {
    expect(resolveAccountProfileState(false, undefined, null)).toBe("signedOut");
  });

  it("prefers signed out over an error when there is no user", () => {
    expect(resolveAccountProfileState(false, undefined, new Error("boom"))).toBe("signedOut");
  });

  it("reports an error only when a user is present alongside one", () => {
    expect(resolveAccountProfileState(false, USER, new Error("boom"))).toBe("error");
  });

  it("reports ready for a settled user with no error", () => {
    expect(resolveAccountProfileState(false, USER, null)).toBe("ready");
  });

  it("is pure — repeated calls agree", () => {
    expect(resolveAccountProfileState(false, USER, null)).toBe(
      resolveAccountProfileState(false, USER, null),
    );
  });
});
