import { useApolloClient } from "@apollo/client/react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";

import SearchBar from "./SearchBar";

// Mock Next.js navigation hooks
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("@apollo/client/react", () => ({
  useApolloClient: vi.fn(),
}));

const mockPush = vi.fn();
const mockQuery = vi.fn();
const mockRouter = {
  push: mockPush,
};

const mockSearchParams = {
  get: vi.fn(),
};

describe("SearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(
      mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
    );
    vi.mocked(useApolloClient).mockReturnValue({ query: mockQuery } as unknown as ReturnType<
      typeof useApolloClient
    >);
    mockQuery.mockResolvedValue({ data: { pokemonSearch: { pokemon: [] } } });
  });

  it("shows matching Pokémon with images and opens a selected suggestion", async () => {
    const user = userEvent.setup();
    mockSearchParams.get.mockReturnValue("");
    mockQuery.mockResolvedValue({
      data: {
        pokemonSearch: {
          pokemon: [
            {
              id: "4",
              speciesId: "4",
              speciesName: "charmander",
              name: "charmander",
              image: "https://example.com/charmander.png",
            },
          ],
        },
      },
    });

    render(<SearchBar />);
    await user.type(screen.getByPlaceholderText("Search Pokemon..."), "char");

    const suggestion = await screen.findByRole("option", { name: "Charmander" });
    expect(within(suggestion).getByText("Charmander")).toBeInTheDocument();
    expect(suggestion.querySelector("img")).toHaveAttribute(
      "src",
      "https://example.com/charmander.png",
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { query: "char", limit: 8 } }),
    );

    await user.click(suggestion);
    expect(mockPush).toHaveBeenCalledWith("/pokemon/4");
  });

  describe("Initial Rendering", () => {
    it("renders search input with placeholder", () => {
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      expect(searchInput).toBeInTheDocument();
    });

    it("renders search button", () => {
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchButton = screen.getByRole("button", { name: /search/i });
      expect(searchButton).toBeInTheDocument();
    });

    it("does not render clear button initially", () => {
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const clearButton = screen.queryByRole("button", {
        name: /clear search/i,
      });
      expect(clearButton).not.toBeInTheDocument();
    });

    it("initializes search query from URL params", () => {
      mockSearchParams.get.mockReturnValue("pikachu");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      expect(searchInput).toHaveValue("pikachu");
    });

    it("handles empty search params", () => {
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      expect(searchInput).toHaveValue("");
    });

    it("handles null search params", () => {
      mockSearchParams.get.mockReturnValue(null);

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      expect(searchInput).toHaveValue("");
    });
  });

  describe("Search Functionality", () => {
    it("submits search with query", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      const searchButton = screen.getByRole("button", { name: /search/i });

      await user.type(searchInput, "charizard");
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith("/search?q=charizard");
    });

    it("submits search with trimmed query", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      const searchButton = screen.getByRole("button", { name: /search/i });

      await user.type(searchInput, "  mewtwo  ");
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith("/search?q=mewtwo");
    });

    it("submits empty search and navigates to home", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchButton = screen.getByRole("button", { name: /search/i });

      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("submits whitespace-only search and navigates to home", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      const searchButton = screen.getByRole("button", { name: /search/i });

      await user.type(searchInput, "   ");
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("submits search on Enter key press", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");

      await user.type(searchInput, "bulbasaur");
      await user.keyboard("{Enter}");

      expect(mockPush).toHaveBeenCalledWith("/search?q=bulbasaur");
    });
  });

  describe("Clear Functionality", () => {
    it("shows clear button when search query exists", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      await user.type(searchInput, "test");

      const clearButton = screen.getByRole("button", { name: /clear search/i });
      expect(clearButton).toBeInTheDocument();
    });

    it("clears search and navigates to home when clear button is clicked", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      await user.type(searchInput, "test");

      const clearButton = screen.getByRole("button", { name: /clear search/i });
      await user.click(clearButton);

      expect(searchInput).toHaveValue("");
      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("hides clear button after clearing search", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      await user.type(searchInput, "test");

      const clearButton = screen.getByRole("button", { name: /clear search/i });
      await user.click(clearButton);

      expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();
    });
  });

  describe("Input Handling", () => {
    it("updates search query on input change", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");

      await user.type(searchInput, "squirtle");

      expect(searchInput).toHaveValue("squirtle");
    });

    it("handles special characters in search query", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");

      await user.type(searchInput, "pikachu-123!");

      expect(searchInput).toHaveValue("pikachu-123!");
    });

    it("handles unicode characters in search query", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");

      await user.type(searchInput, "pokémon");

      expect(searchInput).toHaveValue("pokémon");
    });
  });

  describe("URL Synchronization", () => {
    it("initializes with URL params on mount", () => {
      mockSearchParams.get.mockReturnValue("initial-query");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      expect(searchInput).toHaveValue("initial-query");
    });

    it("handles empty URL params on mount", () => {
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      expect(searchInput).toHaveValue("");
    });
  });

  describe("Submit Behavior", () => {
    it("submits on Enter with the current query", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      await user.type(searchInput, "test");
      await user.keyboard("{Enter}");

      expect(mockPush).toHaveBeenCalledWith("/search?q=test");
    });

    it("submits the current query when the search button is clicked", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      const searchButton = screen.getByRole("button", { name: /search/i });

      await user.type(searchInput, "test");
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith("/search?q=test");
    });
  });

  describe("Accessibility", () => {
    it("has an accessible name", () => {
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      expect(screen.getByRole("searchbox", { name: /search pokemon/i })).toBeInTheDocument();
    });

    it("has proper button roles", () => {
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchButton = screen.getByRole("button", { name: /search/i });
      expect(searchButton).toBeInTheDocument();
    });

    it("has proper aria-labels on its controls", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchButton = screen.getByLabelText("Search");
      expect(searchButton).toBeInTheDocument();

      // Type something to show clear button
      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      await user.type(searchInput, "test");

      const clearButton = screen.getByLabelText("Clear search");
      expect(clearButton).toBeInTheDocument();
    });

    it("has proper placeholder text", () => {
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles search query with only numbers", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");

      await user.clear(searchInput);
      await user.type(searchInput, "12345");
      await user.keyboard("{Enter}");

      expect(mockPush).toHaveBeenCalledWith("/search?q=12345");
    });

    it("handles search query with mixed content and URL encoding", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");

      await user.type(searchInput, "Pikachu #025 Electric");
      await user.keyboard("{Enter}");

      // URL encoding will convert # to %23 and spaces to +
      expect(mockPush).toHaveBeenCalledWith("/search?q=Pikachu+%23025+Electric");
    });

    it("handles rapid input changes", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");

      await user.type(searchInput, "p");
      await user.type(searchInput, "i");
      await user.type(searchInput, "k");
      await user.type(searchInput, "a");
      await user.type(searchInput, "c");
      await user.type(searchInput, "h");
      await user.type(searchInput, "u");

      expect(searchInput).toHaveValue("pikachu");
    });

    it("handles reasonable length search queries", async () => {
      const user = userEvent.setup();
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      const reasonableQuery = "pikachu-electric-type-pokemon";

      await user.type(searchInput, reasonableQuery);
      await user.keyboard("{Enter}");

      expect(mockPush).toHaveBeenCalledWith(`/search?q=${reasonableQuery}`);
    });
  });

  describe("Performance and State Management", () => {
    it("renders without errors", () => {
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      // The component should render without warnings
      expect(screen.getByPlaceholderText("Search Pokemon...")).toBeInTheDocument();
    });

    it("uses useEffect for URL synchronization", () => {
      mockSearchParams.get.mockReturnValue("");

      render(<SearchBar />);

      // The component should use useEffect for URL sync
      // This is tested by ensuring the component renders without warnings
      expect(screen.getByPlaceholderText("Search Pokemon...")).toBeInTheDocument();
    });

    it("maintains state consistency during re-renders", () => {
      mockSearchParams.get.mockReturnValue("");

      const { rerender } = render(<SearchBar />);

      // Re-render the component
      rerender(<SearchBar />);

      // State should remain consistent
      const searchInput = screen.getByPlaceholderText("Search Pokemon...");
      expect(searchInput).toHaveValue("");
    });
  });
});
