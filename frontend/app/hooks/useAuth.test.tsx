import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { authApi, getStoredToken } from "@/lib/auth";
import { useAuth, useIsAuthenticated } from "./useAuth";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    authApi: {
      login: vi.fn(),
      register: vi.fn(),
      confirmPasswordReset: vi.fn(),
      confirmEmailVerification: vi.fn(),
      changePassword: vi.fn(),
      getCurrentUser: vi.fn(),
      logout: actual.authApi.logout,
    },
  };
});

const TOKEN = "test-token";
const USER = { id: "1", email: "test@test.com", username: "test" };

/**
 * A client whose auth cache is already warm before the component under test
 * first renders — the situation every consumer of this hook hits in the app,
 * because `AuthModalProvider` calls it from outside the `<Suspense>` boundary
 * that wraps the header and so resolves both queries first.
 */
function warmClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(["auth", "token"], TOKEN);
  queryClient.setQueryData(["auth", "user", TOKEN], USER);
  return queryClient;
}

function Probe() {
  const { isAuthenticated } = useIsAuthenticated();
  return <span>{isAuthenticated ? "signed-in" : "signed-out"}</span>;
}

function wrap(children: ReactNode, queryClient: QueryClient) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useAuth hydration safety", () => {
  it("reports signed out before mount, even with a signed-in user cached", () => {
    // renderToString runs no effects, so this is both what the server sends and
    // what React must find on the client's first hydration pass. The server has
    // no localStorage and can only ever say signed out, so anything else here
    // means the two disagree and the tree is thrown away.
    const html = renderToString(wrap(<Probe />, warmClient()));

    expect(html).toContain("signed-out");
  });

  it("reports signed in once mounted", () => {
    render(wrap(<Probe />, warmClient()));

    expect(screen.getByText("signed-in")).toBeInTheDocument();
  });
});

describe("useAuth mutations", () => {
  const setup = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => wrap(children, queryClient),
    });
    return { result, queryClient };
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("stores the token and seeds the cache on login", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: "at-1" });
    const { result, queryClient } = setup();

    await act(async () => {
      await result.current.loginAsync({ email: "a@b.c", password: "p" });
    });

    expect(getStoredToken()).toBe("at-1");
    expect(queryClient.getQueryData(["auth", "token"])).toBe("at-1");
  });

  it("does NOT store a token on register", async () => {
    vi.mocked(authApi.register).mockResolvedValue({ message: "check email" });
    const { result, queryClient } = setup();

    await act(async () => {
      await result.current.registerAsync({ email: "a@b.c", password: "p" });
    });

    // Registration no longer authenticates. Storing a token here would let an
    // unverified account straight in and defeat the verification gate.
    expect(getStoredToken()).toBeNull();
    // The query resolves to null — "no token" — rather than staying unset.
    expect(queryClient.getQueryData(["auth", "token"])).toBeNull();
  });

  it("stores the token returned by password reset confirmation", async () => {
    vi.mocked(authApi.confirmPasswordReset).mockResolvedValue({
      access_token: "at-2",
    });
    const { result } = setup();

    await act(async () => {
      await result.current.confirmPasswordResetAsync({
        token: "t",
        password: "p",
      });
    });

    expect(getStoredToken()).toBe("at-2");
  });

  it("stores the token returned by email verification", async () => {
    vi.mocked(authApi.confirmEmailVerification).mockResolvedValue({
      access_token: "at-3",
    });
    const { result } = setup();

    await act(async () => {
      await result.current.confirmEmailVerificationAsync("v-1");
    });

    expect(getStoredToken()).toBe("at-3");
  });

  it("sends the stored token with a password change and leaves the session alone", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: "at-5" });
    vi.mocked(authApi.changePassword).mockResolvedValue({
      message: "Password updated",
    });
    const { result, queryClient } = setup();

    await act(async () => {
      await result.current.loginAsync({ email: "a@b.c", password: "p" });
    });

    await act(async () => {
      await result.current.changePasswordAsync({
        currentPassword: "OldPikachu123!",
        password: "NewPikachu123!",
      });
    });

    expect(authApi.changePassword).toHaveBeenCalledWith("at-5", {
      currentPassword: "OldPikachu123!",
      password: "NewPikachu123!",
    });
    expect(getStoredToken()).toBe("at-5");
    expect(queryClient.getQueryData(["auth", "token"])).toBe("at-5");
  });

  it("clears the token and drops cached groups on logout", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ access_token: "at-4" });
    const { result, queryClient } = setup();

    await act(async () => {
      await result.current.loginAsync({ email: "a@b.c", password: "p" });
    });
    queryClient.setQueryData(["groups"], ["stale"]);

    await act(async () => {
      result.current.logout();
    });

    await waitFor(() => expect(getStoredToken()).toBeNull());
    // Groups are per-user; leaving them cached would leak one user's data
    // into the next session in the same tab.
    expect(queryClient.getQueryData(["groups"])).toBeUndefined();
  });
});
