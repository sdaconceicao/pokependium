import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserAvatar from "./UserAvatar";

const EMAIL = "ash@pallet.town";
const AVATAR_SRC = "https://pokependium.test/ash.png";

async function openMenu(props: Partial<React.ComponentProps<typeof UserAvatar>> = {}) {
  const user = userEvent.setup();
  const onLogout = props.onLogout ?? vi.fn();
  render(<UserAvatar email={EMAIL} onLogout={onLogout} {...props} />);
  await user.click(screen.getByRole("button", { name: "Account menu" }));
  return { user, onLogout };
}

describe("UserAvatar", () => {
  it("renders the account menu trigger", () => {
    render(<UserAvatar email={EMAIL} onLogout={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument();
  });

  it("shows the user's picture in the trigger when there is one", () => {
    render(<UserAvatar email={EMAIL} avatarSrc={AVATAR_SRC} onLogout={vi.fn()} />);

    expect(screen.getByRole("img", { name: EMAIL })).toHaveAttribute("src", AVATAR_SRC);
  });

  it("falls back to initials in the trigger when there is no picture", () => {
    render(<UserAvatar email={EMAIL} onLogout={vi.fn()} />);

    const fallback = screen.getByRole("img", { name: EMAIL });
    expect(fallback).not.toHaveAttribute("src");
    expect(fallback).toHaveTextContent("A");
  });

  describe("the menu", () => {
    it("opens with the account, then lists, then logout", async () => {
      await openMenu();

      const items = screen.getAllByRole("menuitem");
      expect(items.map((item) => item.textContent)).toEqual(["Account", "My groups", "Log out"]);
      // The account row precedes both -- Node.DOCUMENT_POSITION_FOLLOWING
      expect(screen.getByText(EMAIL).compareDocumentPosition(items[0]) & 4).toBeTruthy();
    });

    it("shows the signed-in user's email", async () => {
      await openMenu();

      expect(screen.getByText(EMAIL)).toBeInTheDocument();
    });

    it("shows the avatar beside the email", async () => {
      await openMenu({ avatarSrc: AVATAR_SRC });

      const account = screen.getByText(EMAIL).closest("header") as HTMLElement;
      // alt="" on this one: the email it sits next to already names the account
      expect(within(account).getByRole("presentation")).toHaveAttribute("src", AVATAR_SRC);
    });

    it("gives each item an icon", async () => {
      await openMenu();

      for (const item of screen.getAllByRole("menuitem")) {
        expect(item.querySelector("svg")).toBeInTheDocument();
      }
    });

    it("links My groups to /groups", async () => {
      await openMenu();

      expect(screen.getByRole("menuitem", { name: "My groups" })).toHaveAttribute(
        "href",
        "/groups",
      );
    });

    it("links Account to /account", async () => {
      await openMenu();

      expect(screen.getByRole("menuitem", { name: "Account" })).toHaveAttribute("href", "/account");
    });

    it("still finds the logout item by its accessible name (used by the e2e auth helper)", async () => {
      await openMenu();

      expect(screen.getByRole("menuitem", { name: "Log out" })).toBeInTheDocument();
    });

    it("fires onLogout when Log out is chosen", async () => {
      const { user, onLogout } = await openMenu();

      await user.click(screen.getByRole("menuitem", { name: "Log out" }));

      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it("does not fire onLogout for the navigation items", async () => {
      const { user, onLogout } = await openMenu();

      await user.click(screen.getByRole("menuitem", { name: "My groups" }));

      expect(onLogout).not.toHaveBeenCalled();
    });

    it("shows a pending label and disables the item while logging out", async () => {
      await openMenu({ isLogoutLoading: true });

      const item = screen.getByRole("menuitem", { name: "Logging out…" });
      expect(item).toHaveAttribute("data-disabled", "true");
    });

    it("keeps the logout item enabled by default", async () => {
      await openMenu();

      expect(screen.getByRole("menuitem", { name: "Log out" })).not.toHaveAttribute(
        "data-disabled",
      );
    });
  });
});
