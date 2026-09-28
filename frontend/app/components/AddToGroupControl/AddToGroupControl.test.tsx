import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  useAddPokemonToGroup,
  useCreateGroup,
  useGroupMemberships,
  useGroups,
  useRemovePokemonFromGroup,
} from "@/hooks/useGroups";
import type { Pokemon } from "@/types/graphql";
import type { GroupMembership, PokemonGroup } from "@/types/groups";
import { AddToGroupControl } from "./AddToGroupControl";

vi.mock("@/hooks/useGroups", () => ({
  useGroups: vi.fn(),
  useGroupMemberships: vi.fn(),
  useCreateGroup: vi.fn(),
  useAddPokemonToGroup: vi.fn(),
  useRemovePokemonFromGroup: vi.fn(),
}));

const bulbasaur: Pokemon = {
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

const FAVORITES: PokemonGroup = { id: "g1", name: "Favorites", isDefault: true, pokemonCount: 1 };
const TEAM: PokemonGroup = { id: "g2", name: "Team", isDefault: false, pokemonCount: 0 };

const CREATED_GROUP: PokemonGroup = {
  id: "g3",
  name: "Favorites",
  isDefault: true,
  pokemonCount: 0,
};

const mockCreateGroupAsync = vi.fn();
const mockAddPokemonToGroupAsync = vi.fn();
const mockRemovePokemonFromGroupAsync = vi.fn();

function mockGroups(groups: PokemonGroup[], defaultGroup?: PokemonGroup) {
  vi.mocked(useGroups).mockReturnValue({
    groups,
    defaultGroup,
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useGroups>);
}

function mockMemberships(memberships: GroupMembership[]) {
  vi.mocked(useGroupMemberships).mockReturnValue({
    memberships,
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useGroupMemberships>);
}

function existingListsSection(container: HTMLElement) {
  return container.querySelector(".existingList") as HTMLElement;
}

function newListForm(container: HTMLElement) {
  return container.querySelector(".newListForm") as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();

  mockGroups([]);
  mockMemberships([]);

  vi.mocked(useCreateGroup).mockReturnValue({
    createGroup: vi.fn(),
    createGroupAsync: mockCreateGroupAsync,
    isCreateGroupLoading: false,
    createGroupError: null,
  } as unknown as ReturnType<typeof useCreateGroup>);

  vi.mocked(useAddPokemonToGroup).mockReturnValue({
    addPokemonToGroup: vi.fn(),
    addPokemonToGroupAsync: mockAddPokemonToGroupAsync,
    isAddPokemonToGroupLoading: false,
    addPokemonToGroupError: null,
  } as unknown as ReturnType<typeof useAddPokemonToGroup>);

  vi.mocked(useRemovePokemonFromGroup).mockReturnValue({
    removePokemonFromGroup: vi.fn(),
    removePokemonFromGroupAsync: mockRemovePokemonFromGroupAsync,
    isRemovePokemonFromGroupLoading: false,
    removePokemonFromGroupError: null,
  } as unknown as ReturnType<typeof useRemovePokemonFromGroup>);

  mockCreateGroupAsync.mockResolvedValue(CREATED_GROUP);
  mockAddPokemonToGroupAsync.mockResolvedValue({ pokemonId: bulbasaur.id, speciesId: "1" });
  mockRemovePokemonFromGroupAsync.mockResolvedValue(undefined);
});

describe("AddToGroupControl", () => {
  describe("with no groups", () => {
    it("shows only the always-visible new-group form", () => {
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
      expect(existingListsSection(container)).toBeNull();
      expect(screen.getByRole("textbox", { name: "New group" })).toBeInTheDocument();
    });

    it("prefills the name with Favorites, checked as the default group", () => {
      render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      expect(screen.getByRole("textbox", { name: "New group" })).toHaveValue("Favorites");
      expect(screen.getByRole("checkbox", { name: "Make this my default group" })).toBeChecked();
    });

    it("creates the group and adds the pokemon to it, then closes", async () => {
      const user = userEvent.setup();
      const onDone = vi.fn();
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={onDone} />);

      await user.click(within(newListForm(container)).getByRole("button", { name: "Add" }));

      expect(mockCreateGroupAsync).toHaveBeenCalledWith({ name: "Favorites", isDefault: true });
      expect(mockAddPokemonToGroupAsync).toHaveBeenCalledWith({
        groupId: CREATED_GROUP.id,
        body: { pokemonId: bulbasaur.id, speciesId: bulbasaur.speciesId },
      });
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it("trims the name and respects an unchecked default box", async () => {
      const user = userEvent.setup();
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      const nameField = screen.getByRole("textbox", { name: "New group" });
      await user.clear(nameField);
      await user.type(nameField, "  Shiny Hunt  ");
      await user.click(screen.getByRole("checkbox", { name: "Make this my default group" }));
      await user.click(within(newListForm(container)).getByRole("button", { name: "Add" }));

      expect(mockCreateGroupAsync).toHaveBeenCalledWith({ name: "Shiny Hunt", isDefault: false });
    });

    it("disables submit for an empty or whitespace-only name", async () => {
      const user = userEvent.setup();
      render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      const nameField = screen.getByRole("textbox", { name: "New group" });
      await user.clear(nameField);
      await user.type(nameField, "   ");

      expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    });

    it("also guards a submit event that bypasses the disabled button", async () => {
      const user = userEvent.setup();
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      const nameField = screen.getByRole("textbox", { name: "New group" });
      await user.clear(nameField);
      await user.type(nameField, "   ");
      fireEvent.submit(newListForm(container));

      expect(mockCreateGroupAsync).not.toHaveBeenCalled();
    });

    it("surfaces a create error inline without closing", async () => {
      mockCreateGroupAsync.mockRejectedValue(new Error("name taken"));
      vi.mocked(useCreateGroup).mockReturnValue({
        createGroup: vi.fn(),
        createGroupAsync: mockCreateGroupAsync,
        isCreateGroupLoading: false,
        createGroupError: new Error("name taken"),
      } as unknown as ReturnType<typeof useCreateGroup>);
      const user = userEvent.setup();
      const onDone = vi.fn();
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={onDone} />);

      await user.click(within(newListForm(container)).getByRole("button", { name: "Add" }));

      expect(await screen.findByText("name taken")).toBeInTheDocument();
      expect(onDone).not.toHaveBeenCalled();
    });
  });

  describe("with exactly one group", () => {
    beforeEach(() => {
      mockGroups([FAVORITES], FAVORITES);
    });

    it("shows the group's name as a checkbox rather than a dropdown", () => {
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
      expect(
        within(existingListsSection(container)).getByRole("checkbox", { name: "Favorites" }),
      ).toBeInTheDocument();
    });

    it("leaves the checkbox unchecked and Update disabled when not a member", () => {
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);
      const section = within(existingListsSection(container));

      expect(section.getByRole("checkbox", { name: "Favorites" })).not.toBeChecked();
      expect(section.getByRole("button", { name: "Update" })).toBeDisabled();
    });

    it("checks the box and disables Update when already a member", () => {
      mockMemberships([{ groupId: FAVORITES.id, pokemonId: bulbasaur.id }]);

      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);
      const section = within(existingListsSection(container));

      expect(section.getByRole("checkbox", { name: "Favorites" })).toBeChecked();
      expect(section.getByRole("button", { name: "Update" })).toBeDisabled();
    });

    it("adds the pokemon when the box is checked and Update pressed", async () => {
      const user = userEvent.setup();
      const onDone = vi.fn();
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={onDone} />);
      const section = within(existingListsSection(container));

      await user.click(section.getByRole("checkbox", { name: "Favorites" }));
      await user.click(section.getByRole("button", { name: "Update" }));

      expect(mockAddPokemonToGroupAsync).toHaveBeenCalledWith({
        groupId: FAVORITES.id,
        body: { pokemonId: bulbasaur.id, speciesId: bulbasaur.speciesId },
      });
      expect(mockRemovePokemonFromGroupAsync).not.toHaveBeenCalled();
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it("removes the pokemon when the box is unchecked and Update pressed", async () => {
      mockMemberships([{ groupId: FAVORITES.id, pokemonId: bulbasaur.id }]);
      const user = userEvent.setup();
      const onDone = vi.fn();
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={onDone} />);
      const section = within(existingListsSection(container));

      await user.click(section.getByRole("checkbox", { name: "Favorites" }));
      await user.click(section.getByRole("button", { name: "Update" }));

      expect(mockRemovePokemonFromGroupAsync).toHaveBeenCalledWith({
        groupId: FAVORITES.id,
        pokemonId: bulbasaur.id,
      });
      expect(mockAddPokemonToGroupAsync).not.toHaveBeenCalled();
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });

  describe("with more than one group", () => {
    beforeEach(() => {
      mockGroups([FAVORITES, TEAM], FAVORITES);
    });

    it("renders a multiselect over every group", async () => {
      const user = userEvent.setup();
      render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      await user.click(screen.getByRole("combobox", { name: "Your groups" }));

      const options = await screen.findAllByRole("option");
      expect(options.map((option) => option.textContent)).toEqual(["Favorites", "Team"]);
    });

    it("does not annotate options with their membership -- selection carries it", async () => {
      mockMemberships([{ groupId: FAVORITES.id, pokemonId: bulbasaur.id }]);
      const user = userEvent.setup();
      render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      await user.click(screen.getByRole("combobox", { name: "Your groups" }));

      expect(screen.queryByText(/added/)).not.toBeInTheDocument();
      const favorites = await screen.findByRole("option", { name: "Favorites" });
      expect(favorites).toHaveAttribute("aria-selected", "true");
    });

    it("preselects every group the pokemon is already in, with Update disabled", async () => {
      mockMemberships([
        { groupId: FAVORITES.id, pokemonId: bulbasaur.id },
        { groupId: TEAM.id, pokemonId: bulbasaur.id },
      ]);
      const user = userEvent.setup();
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      expect(
        within(existingListsSection(container)).getByRole("button", { name: "Update" }),
      ).toBeDisabled();

      await user.click(screen.getByRole("combobox", { name: "Your groups" }));

      for (const name of ["Favorites", "Team"]) {
        expect(await screen.findByRole("option", { name })).toHaveAttribute(
          "aria-selected",
          "true",
        );
      }
    });

    it("selects nothing when the pokemon is in none of them", async () => {
      const user = userEvent.setup();
      render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      await user.click(screen.getByRole("combobox", { name: "Your groups" }));

      for (const name of ["Favorites", "Team"]) {
        expect(await screen.findByRole("option", { name })).toHaveAttribute(
          "aria-selected",
          "false",
        );
      }
    });

    it("adds only the newly selected group on Update", async () => {
      mockMemberships([{ groupId: FAVORITES.id, pokemonId: bulbasaur.id }]);
      const user = userEvent.setup();
      const onDone = vi.fn();
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={onDone} />);

      await user.click(screen.getByRole("combobox", { name: "Your groups" }));
      await user.click(await screen.findByRole("option", { name: "Team" }));
      await user.keyboard("{Escape}");
      await user.click(
        within(existingListsSection(container)).getByRole("button", { name: "Update" }),
      );

      expect(mockAddPokemonToGroupAsync).toHaveBeenCalledTimes(1);
      expect(mockAddPokemonToGroupAsync).toHaveBeenCalledWith({
        groupId: TEAM.id,
        body: { pokemonId: bulbasaur.id, speciesId: bulbasaur.speciesId },
      });
      expect(mockRemovePokemonFromGroupAsync).not.toHaveBeenCalled();
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it("removes only the deselected group on Update", async () => {
      mockMemberships([
        { groupId: FAVORITES.id, pokemonId: bulbasaur.id },
        { groupId: TEAM.id, pokemonId: bulbasaur.id },
      ]);
      const user = userEvent.setup();
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      await user.click(screen.getByRole("combobox", { name: "Your groups" }));
      await user.click(await screen.findByRole("option", { name: "Favorites" }));
      await user.keyboard("{Escape}");
      await user.click(
        within(existingListsSection(container)).getByRole("button", { name: "Update" }),
      );

      expect(mockRemovePokemonFromGroupAsync).toHaveBeenCalledTimes(1);
      expect(mockRemovePokemonFromGroupAsync).toHaveBeenCalledWith({
        groupId: FAVORITES.id,
        pokemonId: bulbasaur.id,
      });
      expect(mockAddPokemonToGroupAsync).not.toHaveBeenCalled();
    });

    it("applies an add and a remove together in one Update", async () => {
      mockMemberships([{ groupId: FAVORITES.id, pokemonId: bulbasaur.id }]);
      const user = userEvent.setup();
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      await user.click(screen.getByRole("combobox", { name: "Your groups" }));
      await user.click(await screen.findByRole("option", { name: "Favorites" }));
      await user.click(await screen.findByRole("option", { name: "Team" }));
      await user.keyboard("{Escape}");
      await user.click(
        within(existingListsSection(container)).getByRole("button", { name: "Update" }),
      );

      expect(mockRemovePokemonFromGroupAsync).toHaveBeenCalledWith({
        groupId: FAVORITES.id,
        pokemonId: bulbasaur.id,
      });
      expect(mockAddPokemonToGroupAsync).toHaveBeenCalledWith({
        groupId: TEAM.id,
        body: { pokemonId: bulbasaur.id, speciesId: bulbasaur.speciesId },
      });
    });

    it("surfaces an update error inline without closing", () => {
      vi.mocked(useAddPokemonToGroup).mockReturnValue({
        addPokemonToGroup: vi.fn(),
        addPokemonToGroupAsync: mockAddPokemonToGroupAsync,
        isAddPokemonToGroupLoading: false,
        addPokemonToGroupError: new Error("Could not update that group"),
      } as unknown as ReturnType<typeof useAddPokemonToGroup>);

      render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      expect(screen.getByText("Could not update that group")).toBeInTheDocument();
    });

    it("keeps the popover open when an update rejects", async () => {
      mockRemovePokemonFromGroupAsync.mockRejectedValueOnce(new Error("nope"));
      mockMemberships([{ groupId: FAVORITES.id, pokemonId: bulbasaur.id }]);
      const user = userEvent.setup();
      const onDone = vi.fn();
      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={onDone} />);

      await user.click(screen.getByRole("combobox", { name: "Your groups" }));
      await user.click(await screen.findByRole("option", { name: "Favorites" }));
      await user.keyboard("{Escape}");
      await user.click(
        within(existingListsSection(container)).getByRole("button", { name: "Update" }),
      );

      expect(onDone).not.toHaveBeenCalled();
    });
  });

  describe("while the underlying queries are still loading", () => {
    it("treats an undefined groups list the same as an empty one", () => {
      vi.mocked(useGroups).mockReturnValue({
        groups: undefined,
        defaultGroup: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useGroups>);

      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      expect(existingListsSection(container)).toBeNull();
      expect(screen.getByRole("textbox", { name: "New group" })).toHaveValue("Favorites");
    });

    it("treats undefined memberships the same as no memberships", () => {
      mockGroups([FAVORITES], FAVORITES);
      vi.mocked(useGroupMemberships).mockReturnValue({
        memberships: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useGroupMemberships>);

      const { container } = render(<AddToGroupControl pokemon={bulbasaur} onDone={vi.fn()} />);

      expect(
        within(existingListsSection(container)).getByRole("button", { name: "Update" }),
      ).toBeInTheDocument();
    });
  });
});
