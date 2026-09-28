import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Pokemon } from "@/types";
import { PokemonHero } from "./PokemonHero";

const back = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back, replace }),
  usePathname: () => "/pokemon/4",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} />;
  },
}));

const charmander = {
  id: "4",
  speciesId: "4",
  speciesName: "charmander",
  name: "charmander",
  image: "https://example.com/4.png",
  type: ["Fire"],
  height: 2.29659,
  weight: 15.211878,
  forms: [
    {
      id: "4",
      name: "charmander",
      image: "https://example.com/4.png",
      isDefault: true,
    },
  ],
} as Pokemon;

describe("PokemonHero", () => {
  beforeEach(() => {
    back.mockClear();
  });

  it("renders the name as the page heading", () => {
    render(<PokemonHero pokemon={charmander} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Charmander");
  });

  it("heads a form page with the species rather than the form slug", () => {
    render(<PokemonHero pokemon={{ ...charmander, name: "charmander-gmax" } as Pokemon} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Charmander");
  });

  it("heads with the species even when the default form's name carries a suffix", () => {
    render(
      <PokemonHero
        pokemon={
          {
            ...charmander,
            id: "681",
            speciesId: "681",
            speciesName: "aegislash",
            name: "aegislash-shield",
          } as Pokemon
        }
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Aegislash");
    expect(screen.queryByRole("heading", { name: "Aegislash Shield" })).not.toBeInTheDocument();
  });

  it("renders the zero-padded dex number", () => {
    render(<PokemonHero pokemon={charmander} />);

    expect(screen.getByText("#004")).toBeInTheDocument();
  });

  it("numbers a form by its species, not by its own id", () => {
    render(
      <PokemonHero pokemon={{ ...charmander, id: "10199", name: "charmander-gmax" } as Pokemon} />,
    );

    expect(screen.getByText("#004")).toBeInTheDocument();
  });

  it("renders the artwork with the name as alt text", () => {
    render(<PokemonHero pokemon={charmander} />);

    expect(screen.getByAltText("charmander")).toHaveAttribute("src", charmander.image);
  });

  it("renders a pill for every type", () => {
    render(<PokemonHero pokemon={{ ...charmander, type: ["Grass", "Poison"] } as Pokemon} />);

    expect(screen.getByText("Grass")).toBeInTheDocument();
    expect(screen.getByText("Poison")).toBeInTheDocument();
  });

  it("renders the type pills in the toolbar alongside the dex number", () => {
    const { container } = render(
      <PokemonHero pokemon={{ ...charmander, type: ["Grass", "Poison"] } as Pokemon} />,
    );

    // Both readings share the number's strip rather than sitting down in the
    // body, which is where the blurb goes now.
    const toolbar = container.querySelector(".heroToolbar");
    expect(toolbar).toContainElement(screen.getByText("Grass"));
    expect(toolbar).toContainElement(screen.getByText("Poison"));
    expect(toolbar).toContainElement(screen.getByText("#004"));
  });

  describe("description", () => {
    const blurb = "It has a preference for hot things.";

    it("renders the blurb under the name", () => {
      render(<PokemonHero pokemon={{ ...charmander, description: blurb } as Pokemon} />);

      expect(screen.getByText(blurb)).toBeInTheDocument();
    });

    it("is left out entirely when the species has no blurb", () => {
      const { container } = render(
        <PokemonHero pokemon={{ ...charmander, description: null } as Pokemon} />,
      );

      expect(container.querySelector("p")).not.toBeInTheDocument();
    });
  });

  describe("physical stats", () => {
    it("renders height and weight under the description", () => {
      render(<PokemonHero pokemon={charmander} />);

      expect(screen.getByText("Height")).toBeInTheDocument();
      expect(screen.getByText("Weight")).toBeInTheDocument();
      expect(screen.getByText("2'04\"")).toBeInTheDocument();
      expect(screen.getByText("15.2 lbs")).toBeInTheDocument();
    });
  });

  it("navigates back when the toolbar button is clicked", async () => {
    const user = userEvent.setup();
    render(<PokemonHero pokemon={charmander} />);

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(back).toHaveBeenCalledTimes(1);
  });

  it("applies the caller's type class so the --type-* palette cascades in", () => {
    const { container } = render(<PokemonHero pokemon={charmander} className="type-fire" />);

    expect(container.firstChild).toHaveClass("type-fire");
  });

  it("stays an inset card by default", () => {
    const { container } = render(<PokemonHero pokemon={charmander} />);

    expect(container.querySelector("section")).not.toHaveClass("flush");
  });

  it("runs out to the container's edges when flush", () => {
    const { container } = render(<PokemonHero pokemon={charmander} flush />);

    expect(container.querySelector("section")).toHaveClass("flush");
  });

  describe("form switcher", () => {
    const charmanderWithForms = {
      ...charmander,
      forms: [
        ...(charmander.forms ?? []),
        {
          id: "10199",
          name: "charmander-gmax",
          image: "https://example.com/10199.png",
          isDefault: false,
        },
      ],
    } as Pokemon;

    it("is left out when the Pokemon has no alternate form", () => {
      render(<PokemonHero pokemon={charmander} />);

      expect(screen.queryByRole("combobox", { name: "Form" })).not.toBeInTheDocument();
    });

    it("is offered once there is something to switch to", () => {
      render(<PokemonHero pokemon={charmanderWithForms} />);

      expect(screen.getByRole("combobox", { name: "Form" })).toBeInTheDocument();
    });
  });
});
