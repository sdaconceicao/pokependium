import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuthModal } from "@/providers/AuthModalProvider";
import SignInPrompt from "./SignInPrompt";

vi.mock("@/providers/AuthModalProvider", () => ({
  useAuthModal: vi.fn(),
}));

const openSignIn = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuthModal).mockReturnValue({
    openSignIn,
    openSignUp: vi.fn(),
    isAuthModalOpen: false,
  });
});

describe("SignInPrompt", () => {
  it("renders the supplied message", () => {
    render(<SignInPrompt message="Sign in to manage your account." />);

    expect(screen.getByText("Sign in to manage your account.")).toBeInTheDocument();
  });

  it("opens the sign-in modal when pressed", async () => {
    const user = userEvent.setup();
    render(<SignInPrompt message="Sign in to continue." />);

    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(openSignIn).toHaveBeenCalledTimes(1);
  });
});
