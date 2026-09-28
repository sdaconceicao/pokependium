import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { authApi } from "@/lib/auth";
import { useAvatar } from "./useAvatar";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    authApi: {
      getAvatar: vi.fn(),
      uploadAvatar: vi.fn(),
      deleteAvatar: vi.fn(),
    },
  };
});

const TOKEN = "test-token";
const DATA_URI = "data:image/png;base64,iVBORw0KGgo=";

function wrap(children: ReactNode, queryClient: QueryClient) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(["auth", "token"], TOKEN);
  const { result } = renderHook(() => useAvatar(), {
    wrapper: ({ children }) => wrap(children, queryClient),
  });
  return { result, queryClient };
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("access_token", TOKEN);
  vi.clearAllMocks();
});

describe("useAvatar", () => {
  it("exposes the stored image as avatarSrc", async () => {
    vi.mocked(authApi.getAvatar).mockResolvedValue({ image: DATA_URI });
    const { result } = setup();

    await waitFor(() => expect(result.current.avatarSrc).toBe(DATA_URI));
    expect(authApi.getAvatar).toHaveBeenCalledWith(TOKEN);
  });

  it("turns a null image into undefined", async () => {
    vi.mocked(authApi.getAvatar).mockResolvedValue({ image: null });
    const { result } = setup();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.avatarSrc).toBeUndefined();
  });

  it("does not fetch without a token", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(["auth", "token"], null);
    renderHook(() => useAvatar(), {
      wrapper: ({ children }) => wrap(children, queryClient),
    });

    expect(authApi.getAvatar).not.toHaveBeenCalled();
  });

  it("uploads a file with the stored token and refetches", async () => {
    vi.mocked(authApi.getAvatar).mockResolvedValue({ image: null });
    vi.mocked(authApi.uploadAvatar).mockResolvedValue({ message: "Avatar updated" });
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File([new Uint8Array([1, 2, 3])], "pikachu.png", {
      type: "image/png",
    });
    vi.mocked(authApi.getAvatar).mockResolvedValue({ image: DATA_URI });

    await act(async () => {
      await result.current.uploadAvatarAsync({ file });
    });

    expect(authApi.uploadAvatar).toHaveBeenCalledWith(TOKEN, file, undefined);
    await waitFor(() => expect(result.current.avatarSrc).toBe(DATA_URI));
  });

  it("passes an onProgress callback through to the request", async () => {
    vi.mocked(authApi.getAvatar).mockResolvedValue({ image: null });
    vi.mocked(authApi.uploadAvatar).mockResolvedValue({ message: "Avatar updated" });
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File([new Uint8Array([1])], "pikachu.png", { type: "image/png" });
    const onProgress = vi.fn();

    await act(async () => {
      await result.current.uploadAvatarAsync({ file, onProgress });
    });

    expect(authApi.uploadAvatar).toHaveBeenCalledWith(TOKEN, file, onProgress);
  });

  it("removes the avatar and refetches", async () => {
    vi.mocked(authApi.getAvatar).mockResolvedValue({ image: DATA_URI });
    vi.mocked(authApi.deleteAvatar).mockResolvedValue({ message: "Avatar removed" });
    const { result } = setup();
    await waitFor(() => expect(result.current.avatarSrc).toBe(DATA_URI));

    vi.mocked(authApi.getAvatar).mockResolvedValue({ image: null });

    await act(async () => {
      await result.current.removeAvatarAsync();
    });

    expect(authApi.deleteAvatar).toHaveBeenCalledWith(TOKEN);
    await waitFor(() => expect(result.current.avatarSrc).toBeUndefined());
  });

  it("surfaces a fetch failure without retrying", async () => {
    vi.mocked(authApi.getAvatar).mockRejectedValue(new Error("Failed to fetch avatar"));
    const { result } = setup();

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(authApi.getAvatar).toHaveBeenCalledTimes(1);
  });
});
