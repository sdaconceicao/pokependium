import { render, screen } from "@testing-library/react";
import { ContentPanel } from "./ContentPanel";

describe("ContentPanel", () => {
  it("renders its children", () => {
    render(
      <ContentPanel>
        <p>Panel body</p>
      </ContentPanel>,
    );

    expect(screen.getByText("Panel body")).toBeInTheDocument();
  });

  it("applies the panel class when no className is given", () => {
    render(<ContentPanel>Body</ContentPanel>);

    expect(screen.getByText("Body").className).toMatch(/panel/);
  });

  it("merges a page-supplied className alongside the panel class", () => {
    render(<ContentPanel className="page-layout">Body</ContentPanel>);

    const panel = screen.getByText("Body");
    expect(panel.className).toMatch(/panel/);
    expect(panel).toHaveClass("page-layout");
  });
});
