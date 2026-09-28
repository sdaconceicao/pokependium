import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGroupMemberships } from "@/hooks/useGroups";
import type { Pokemon } from "@/types/graphql";
import type { GroupMembership } from "@/types/groups";
import { AddToGroupButton } from "./AddToGroupButton";

vi.mock("@/hooks/useGroups", () => ({
  useGroupMemberships: vi.fn(),
}));

const mockRequestOpen = vi.fn();
const mockClearResume = vi.fn();
let mockResumeFor: string | null = null;

vi.mock("@/providers/AddToGroupProvider", () => ({
  useAddToGroup: () => ({
    requestOpen: mockRequestOpen,
    resumeFor: mockResumeFor,
    clearResume: mockClearResume,
  }),
}));

vi.mock("@/components/AddToGroupControl", () => ({
  AddToGroupControl: ({ pokemon, onDone }: { pokemon: Pokemon; onDone: () => void }) => (
    <div>
      <p>{`control for ${pokemon.name}`}</p>
      <button type="button" onClick={onDone}>
        finish
      </button>
    </div>
  ),
}));

const pokemon: Pokemon = {
  id: "1",
  speciesId: "1",
  speciesName: "bulbasaur",
  name: "bulbasaur",
  image: "https://example.com/bulbasaur.jpg",
  type: ["grass", "poison"],
  height: 2.29659,
  weight: 15.211878,
  abilitiesLite: [],
  stats: {
    hp: 45,
    attack: 49,
    defense: 49,
    specialAttack: 65,
    specialDefense: 65,
    speed: 45,
  },
};

function mockMemberships(memberships: GroupMembership[] | undefined) {
  vi.mocked(useGroupMemberships).mockReturnValue({
    memberships,
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useGroupMemberships>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResumeFor = null;
  mockMemberships([]);
});

describe("AddToGroupButton", () => {
  it("renders the add label and icon when the pokemon is in no group", () => {
    render(<AddToGroupButton pokemon={pokemon} />);

    expect(screen.getByRole("button", { name: "Add Bulbasaur to a group" })).toBeInTheDocument();
  });

  it("renders the manage label when the pokemon is already saved somewhere", () => {
    mockMemberships([{ groupId: "g1", pokemonId: pokemon.id }]);
    render(<AddToGroupButton pokemon={pokemon} />);

    expect(screen.getByRole("button", { name: "Manage Bulbasaur's groups" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Bulbasaur to a group" }),
    ).not.toBeInTheDocument();
  });

  it("treats memberships still loading as not saved", () => {
    mockMemberships(undefined);
    render(<AddToGroupButton pokemon={pokemon} />);

    expect(screen.getByRole("button", { name: "Add Bulbasaur to a group" })).toBeInTheDocument();
  });

  it("applies a custom className to the trigger button", () => {
    render(<AddToGroupButton pokemon={pokemon} className="probe" />);

    expect(screen.getByRole("button", { name: "Add Bulbasaur to a group" })).toHaveClass("probe");
  });

  it("does not render the control before it is opened", () => {
    render(<AddToGroupButton pokemon={pokemon} />);

    expect(screen.queryByText("control for bulbasaur")).not.toBeInTheDocument();
  });

  it("asks the provider before opening, and opens when it allows it", async () => {
    mockRequestOpen.mockReturnValue(true);
    const user = userEvent.setup();
    render(<AddToGroupButton pokemon={pokemon} />);

    await user.click(screen.getByRole("button", { name: "Add Bulbasaur to a group" }));

    expect(mockRequestOpen).toHaveBeenCalledWith(pokemon);
    expect(screen.getByText("control for bulbasaur")).toBeInTheDocument();
  });

  it("does not open when the provider sends the press to sign in instead", async () => {
    mockRequestOpen.mockReturnValue(false);
    const user = userEvent.setup();
    render(<AddToGroupButton pokemon={pokemon} />);

    await user.click(screen.getByRole("button", { name: "Add Bulbasaur to a group" }));

    expect(screen.queryByText("control for bulbasaur")).not.toBeInTheDocument();
  });

  it("closes when the trigger is pressed again while open", async () => {
    mockRequestOpen.mockReturnValue(true);
    const user = userEvent.setup();
    render(<AddToGroupButton pokemon={pokemon} />);
    const trigger = screen.getByRole("button", { name: "Add Bulbasaur to a group" });

    await user.click(trigger);
    expect(screen.getByText("control for bulbasaur")).toBeInTheDocument();

    await user.click(trigger);

    expect(screen.queryByText("control for bulbasaur")).not.toBeInTheDocument();
    expect(mockRequestOpen).toHaveBeenCalledTimes(1);
  });

  it("closes the control when it reports it is done", async () => {
    mockRequestOpen.mockReturnValue(true);
    const user = userEvent.setup();
    render(<AddToGroupButton pokemon={pokemon} />);

    await user.click(screen.getByRole("button", { name: "Add Bulbasaur to a group" }));
    expect(screen.getByText("control for bulbasaur")).toBeInTheDocument();

    await user.click(screen.getByText("finish"));

    expect(screen.queryByText("control for bulbasaur")).not.toBeInTheDocument();
  });

  it("reopens and clears the resume signal once it matches this pokemon", () => {
    mockResumeFor = pokemon.id;
    render(<AddToGroupButton pokemon={pokemon} />);

    expect(screen.getByText("control for bulbasaur")).toBeInTheDocument();
    expect(mockClearResume).toHaveBeenCalledTimes(1);
  });

  it("ignores a resume signal for a different pokemon", () => {
    mockResumeFor = "some-other-id";
    render(<AddToGroupButton pokemon={pokemon} />);

    expect(screen.queryByText("control for bulbasaur")).not.toBeInTheDocument();
    expect(mockClearResume).not.toHaveBeenCalled();
  });
});
