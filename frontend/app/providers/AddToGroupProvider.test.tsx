import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import type { Pokemon } from "@/types/graphql";
import AddToGroupProvider, { useAddToGroup } from "./AddToGroupProvider";

const mockOpenSignIn = vi.fn();
let mockUser: { id: string } | undefined;
let mockIsAuthModalOpen = false;
let mockStoredToken: string | null = null;

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/auth", () => ({
  getStoredToken: () => mockStoredToken,
}));

vi.mock("./AuthModalProvider", () => ({
  useAuthModal: () => ({
    openSignIn: mockOpenSignIn,
    openSignUp: vi.fn(),
    isAuthModalOpen: mockIsAuthModalOpen,
  }),
}));

const bulbasaur: Pokemon = {
  id: "1",
  speciesId: "1",
  speciesName: "bulbasaur",
  name: "bulbasaur",
  image: "https://example.com/bulbasaur.jpg",
  type: ["grass"],
  height: 2.29659,
  weight: 15.211878,
  abilitiesLite: [],
  stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 },
};

function Consumer() {
  const { requestOpen, resumeFor, clearResume } = useAddToGroup();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (resumeFor === bulbasaur.id) {
      setIsOpen(true);
      clearResume();
    }
  }, [resumeFor, clearResume]);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (requestOpen(bulbasaur)) setIsOpen(true);
        }}
      >
        add bulbasaur
      </button>
      {isOpen && (
        <div>
          <h2>{`Add Bulbasaur to a group`}</h2>
          <button type="button" onClick={() => setIsOpen(false)}>
            dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function renderProvider() {
  return render(
    <AddToGroupProvider>
      <Consumer />
    </AddToGroupProvider>,
  );
}

describe("AddToGroupProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = undefined;
    mockIsAuthModalOpen = false;
    mockStoredToken = null;
  });

  it("renders children and no control by default", () => {
    renderProvider();

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("sends a signed-out press to sign in instead of opening the control", () => {
    renderProvider();

    fireEvent.click(screen.getByText("add bulbasaur"));

    expect(mockOpenSignIn).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("heading", { name: "Add Bulbasaur to a group" }),
    ).not.toBeInTheDocument();
  });

  it("allows a signed-in press to open directly", () => {
    mockUser = { id: "1" };
    renderProvider();

    fireEvent.click(screen.getByText("add bulbasaur"));

    expect(mockOpenSignIn).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Add Bulbasaur to a group" })).toBeInTheDocument();
  });

  it("resumes and opens the control once the user appears after a signed-out press", () => {
    const { rerender } = renderProvider();

    fireEvent.click(screen.getByText("add bulbasaur"));
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();

    mockUser = { id: "1" };
    rerender(
      <AddToGroupProvider>
        <Consumer />
      </AddToGroupProvider>,
    );

    expect(screen.getByRole("heading", { name: "Add Bulbasaur to a group" })).toBeInTheDocument();
  });

  it("drops the pending add when the sign-in form is closed without signing in", () => {
    const { rerender } = renderProvider();

    fireEvent.click(screen.getByText("add bulbasaur"));
    mockIsAuthModalOpen = true;
    rerender(
      <AddToGroupProvider>
        <Consumer />
      </AddToGroupProvider>,
    );
    mockIsAuthModalOpen = false;
    rerender(
      <AddToGroupProvider>
        <Consumer />
      </AddToGroupProvider>,
    );

    mockUser = { id: "1" };
    rerender(
      <AddToGroupProvider>
        <Consumer />
      </AddToGroupProvider>,
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("keeps the pending add while a completed sign-up is still fetching the user", () => {
    const { rerender } = renderProvider();
    const rerenderProvider = () =>
      rerender(
        <AddToGroupProvider>
          <Consumer />
        </AddToGroupProvider>,
      );

    fireEvent.click(screen.getByText("add bulbasaur"));
    mockIsAuthModalOpen = true;
    rerenderProvider();

    mockStoredToken = "a-fresh-token";
    mockIsAuthModalOpen = false;
    rerenderProvider();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();

    mockUser = { id: "1" };
    rerenderProvider();

    expect(screen.getByRole("heading", { name: "Add Bulbasaur to a group" })).toBeInTheDocument();
  });

  it("does not reopen a resumed control the user just dismissed", () => {
    const { rerender } = renderProvider();

    fireEvent.click(screen.getByText("add bulbasaur"));

    mockUser = { id: "1" };
    rerender(
      <AddToGroupProvider>
        <Consumer />
      </AddToGroupProvider>,
    );
    expect(screen.getByRole("heading", { name: "Add Bulbasaur to a group" })).toBeInTheDocument();

    fireEvent.click(screen.getByText("dismiss"));
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();

    rerender(
      <AddToGroupProvider>
        <Consumer />
      </AddToGroupProvider>,
    );
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("throws when useAddToGroup is used outside the provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Consumer />)).toThrow(
      "useAddToGroup must be used within an AddToGroupProvider",
    );

    consoleError.mockRestore();
  });
});
