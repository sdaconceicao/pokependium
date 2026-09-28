import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/providers/AuthModalProvider";
import type { User } from "@/types";
import AccountProfile from "./AccountProfile";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/providers/AuthModalProvider", () => ({
  useAuthModal: vi.fn(),
}));

vi.mock("../AccountAvatar", () => ({
  default: () => <div data-testid="account-avatar" />,
}));

const USER: User = {
  id: "1",
  email: "ash@pallet.town",
  username: "ash@pallet.town",
  firstName: "",
  lastName: "",
};

const openSignIn = vi.fn();

const setAuth = (overrides: Partial<ReturnType<typeof useAuth>> = {}) =>
  vi.mocked(useAuth).mockReturnValue({
    user: USER,
    isLoading: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useAuth>);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuthModal).mockReturnValue({
    openSignIn,
    openSignUp: vi.fn(),
    isAuthModalOpen: false,
  });
  setAuth();
});

describe("AccountProfile", () => {
  it("shows the heading and intro line", () => {
    render(<AccountProfile />);

    expect(screen.getByRole("heading", { name: "Your account" })).toBeInTheDocument();
  });

  describe("loading", () => {
    it("shows a skeleton while auth is resolving", () => {
      setAuth({ user: undefined, isLoading: true });

      render(<AccountProfile />);

      expect(screen.getByLabelText("Loading your account")).toBeInTheDocument();
    });
  });

  describe("signed out", () => {
    it("prompts to sign in", async () => {
      const user = userEvent.setup();
      setAuth({ user: undefined, isLoading: false });

      render(<AccountProfile />);
      expect(screen.getByText("Sign in to manage your account.")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Sign In" }));
      expect(openSignIn).toHaveBeenCalledTimes(1);
    });
  });

  describe("error", () => {
    it("surfaces the error when a user is cached alongside one", () => {
      setAuth({ error: new Error("network down") });

      render(<AccountProfile />);

      expect(screen.getByRole("status")).toHaveTextContent("network down");
    });
  });

  describe("ready", () => {
    it("shows the email and username", () => {
      render(<AccountProfile />);

      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Username")).toBeInTheDocument();
      expect(screen.getByText("Password")).toBeInTheDocument();
      expect(screen.getAllByText("ash@pallet.town")).toHaveLength(2);
    });

    it("omits name rows that have nothing in them", () => {
      render(<AccountProfile />);

      expect(screen.queryByText("First name")).not.toBeInTheDocument();
      expect(screen.queryByText("Last name")).not.toBeInTheDocument();
    });

    it("shows name rows once the names are populated", () => {
      setAuth({ user: { ...USER, firstName: "Ash", lastName: "Ketchum" } });

      render(<AccountProfile />);

      expect(screen.getByText("First name")).toBeInTheDocument();
      expect(screen.getByText("Ash")).toBeInTheDocument();
      expect(screen.getByText("Last name")).toBeInTheDocument();
      expect(screen.getByText("Ketchum")).toBeInTheDocument();
    });

    it("masks the password and offers an icon link to change it", () => {
      render(<AccountProfile />);

      const link = screen.getByRole("link", { name: "Change your password" });
      expect(link).toHaveAttribute("href", "/account/password");
      expect(link.querySelector("svg")).toBeInTheDocument();
    });

    it("puts the avatar beside the profile details", () => {
      render(<AccountProfile />);

      expect(screen.getByTestId("account-avatar")).toBeInTheDocument();
    });

    it("links to the change-password screen", () => {
      render(<AccountProfile />);

      expect(screen.getByRole("link", { name: "Change your password" })).toHaveAttribute(
        "href",
        "/account/password",
      );
    });
  });
});
