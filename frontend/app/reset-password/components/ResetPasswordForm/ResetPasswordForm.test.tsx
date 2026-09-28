import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/toast";
import ResetPasswordForm from "./ResetPasswordForm";

vi.mock("@/lib/toast", () => ({ notify: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const VALID_PASSWORD = "Pikachu123!";

function setup({
  token = "reset-token-123",
  confirmPasswordResetAsync = vi.fn().mockResolvedValue({ access_token: "at-1" }),
} = {}) {
  const replace = vi.fn();
  vi.mocked(useRouter).mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(token ? `token=${token}` : "") as unknown as ReturnType<
      typeof useSearchParams
    >,
  );
  vi.mocked(useAuth).mockReturnValue({
    confirmPasswordResetAsync,
    isConfirmPasswordResetLoading: false,
  } as unknown as ReturnType<typeof useAuth>);

  render(<ResetPasswordForm />);
  return { replace, confirmPasswordResetAsync, user: userEvent.setup() };
}

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Set new password" }));

describe("ResetPasswordForm", () => {
  afterEach(() => vi.clearAllMocks());

  it("refuses to render a form when the link has no token", () => {
    setup({ token: "" });

    expect(screen.getByText(/missing its token/)).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  });

  it("rejects a password that fails the shared policy", async () => {
    const { confirmPasswordResetAsync, user } = setup();

    await user.type(screen.getByLabelText("New password"), "weak");
    await user.type(screen.getByLabelText("Confirm new password"), "weak");
    await submit(user);

    expect(
      await screen.findByText("Password must be at least 8 characters long"),
    ).toBeInTheDocument();
    expect(confirmPasswordResetAsync).not.toHaveBeenCalled();
  });

  it("rejects a mismatched confirmation", async () => {
    const { confirmPasswordResetAsync, user } = setup();

    await user.type(screen.getByLabelText("New password"), VALID_PASSWORD);
    await user.type(screen.getByLabelText("Confirm new password"), "Different1!");
    await submit(user);

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(confirmPasswordResetAsync).not.toHaveBeenCalled();
  });

  it("submits the token with the password, then replaces the URL", async () => {
    const { replace, confirmPasswordResetAsync, user } = setup();

    await user.type(screen.getByLabelText("New password"), VALID_PASSWORD);
    await user.type(screen.getByLabelText("Confirm new password"), VALID_PASSWORD);
    await submit(user);

    expect(confirmPasswordResetAsync).toHaveBeenCalledWith({
      token: "reset-token-123",
      password: VALID_PASSWORD,
    });
    // replace, not push — the token must not survive in history.
    expect(replace).toHaveBeenCalledWith("/");
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Password updated", variant: "success" }),
    );
  });

  it("toasts the API error and stays put", async () => {
    const { replace, user } = setup({
      confirmPasswordResetAsync: vi
        .fn()
        .mockRejectedValue(new Error("Invalid or expired reset token")),
    });

    await user.type(screen.getByLabelText("New password"), VALID_PASSWORD);
    await user.type(screen.getByLabelText("Confirm new password"), VALID_PASSWORD);
    await submit(user);

    await vi.waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Password reset failed",
          description: "Invalid or expired reset token",
          variant: "error",
        }),
      ),
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
