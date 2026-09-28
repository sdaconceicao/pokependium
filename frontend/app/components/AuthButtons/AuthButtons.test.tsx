import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import AuthButtons from "./AuthButtons";

vi.mock("@/providers/AuthModalProvider", () => ({
  useAuthModal: () => ({ openSignIn: vi.fn(), openSignUp: vi.fn() }),
}));

const TOKEN = "test-token";
const USER = { id: "1", email: "test@test.com", username: "test" };

/**
 * A client whose auth cache is already warm before AuthButtons first renders.
 *
 * This is the real-world situation: `AuthModalProvider` also calls `useAuth`,
 * and it sits outside the `<Suspense fallback={null}>` that wraps AuthButtons in
 * AppShell. It therefore hydrates first and resolves both auth queries, so by
 * the time React gets around to hydrating the deferred boundary the user is
 * already in the cache.
 */
function warmClient(avatar: string | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(["auth", "token"], TOKEN);
  queryClient.setQueryData(["auth", "user", TOKEN], USER);
  queryClient.setQueryData(["auth", "avatar", TOKEN], { image: avatar });
  return queryClient;
}

function wrap(children: ReactNode, queryClient: QueryClient) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("AuthButtons", () => {
  it("renders the signed-out button before mount, even with a signed-in user cached", () => {
    // renderToString never runs effects, so it produces exactly what the server
    // sends *and* what React must find on the client's first hydration pass. The
    // server has no localStorage, so it can only ever say "signed out"; if a warm
    // cache makes this render the avatar instead, the two disagree and hydration
    // fails with "server rendered HTML didn't match the client".
    const html = renderToString(wrap(<AuthButtons />, warmClient()));

    expect(html).toContain("Sign In");
    expect(html).not.toContain("Account menu");
  });

  it("shows the account menu once mounted on the client", () => {
    render(wrap(<AuthButtons />, warmClient()));

    expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign In" })).not.toBeInTheDocument();
  });

  it("shows the sign-in button when there is no user", () => {
    render(
      wrap(<AuthButtons />, new QueryClient({ defaultOptions: { queries: { retry: false } } })),
    );

    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("shows the stored avatar in the header once there is one", () => {
    const dataUri = "data:image/png;base64,iVBORw0KGgo=";

    render(wrap(<AuthButtons />, warmClient(dataUri)));

    expect(screen.getByRole("img", { name: USER.email })).toHaveAttribute("src", dataUri);
  });

  it("falls back to initials when the account has no avatar", () => {
    render(wrap(<AuthButtons />, warmClient()));

    const fallback = screen.getByRole("img", { name: USER.email });
    expect(fallback).not.toHaveAttribute("src");
  });
});
