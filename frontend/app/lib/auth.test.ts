import { authApi, getStoredToken, requireStoredToken, setStoredToken } from "./auth";

const okJson = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("authApi", () => {
  it("posts credentials to /auth/login and returns the token", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({ access_token: "at-1" }));

    const result = await authApi.login({
      email: "ash@pallet.town",
      password: "Pikachu123!",
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toMatch(/\/auth\/login$/);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      email: "ash@pallet.town",
      password: "Pikachu123!",
    });
    expect(result).toEqual({ access_token: "at-1" });
  });

  it("throws the API's message when login fails", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "Password does not match" }), {
        status: 400,
      }),
    );

    await expect(authApi.login({ email: "ash@pallet.town", password: "wrong" })).rejects.toThrow(
      "Password does not match",
    );
  });

  it("falls back to a default message when the error body is not JSON", async () => {
    // A 502 from a proxy returns HTML, not JSON — the .catch(() => ({}))
    // fallback is the only thing standing between that and a crash.
    vi.mocked(fetch).mockResolvedValue(new Response("<html>", { status: 502 }));

    await expect(authApi.login({ email: "ash@pallet.town", password: "x" })).rejects.toThrow(
      "Login failed",
    );
  });

  it("posts the email alone to the reset endpoint", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({ message: "sent" }));

    await authApi.requestPasswordReset("ash@pallet.town");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toMatch(/\/auth\/password-reset$/);
    expect(JSON.parse(init?.body as string)).toEqual({
      email: "ash@pallet.town",
    });
  });

  it("posts token and password to the reset-confirm endpoint", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({ access_token: "at-2" }));

    await authApi.confirmPasswordReset({ token: "t-1", password: "New1!aaa" });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toMatch(/\/auth\/password-reset\/confirm$/);
    expect(JSON.parse(init?.body as string)).toEqual({
      token: "t-1",
      password: "New1!aaa",
    });
  });

  it("posts the token alone to the verify endpoint", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({ access_token: "at-3" }));

    await authApi.confirmEmailVerification("v-1");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toMatch(/\/auth\/verify-email$/);
    expect(JSON.parse(init?.body as string)).toEqual({ token: "v-1" });
  });

  it("sends the bearer token when fetching the current user", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({ id: "1" }));

    await authApi.getCurrentUser("at-4");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.headers).toEqual({ Authorization: "Bearer at-4" });
  });

  it("refuses to fetch the current user without a token", async () => {
    await expect(authApi.getCurrentUser("")).rejects.toThrow("No token provided");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("posts both passwords to the change-password endpoint with the bearer token", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({ message: "Password updated" }));

    const result = await authApi.changePassword("at-6", {
      currentPassword: "OldPikachu123!",
      password: "NewPikachu123!",
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toMatch(/\/auth\/change-password$/);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer at-6",
    });
    expect(JSON.parse(init?.body as string)).toEqual({
      currentPassword: "OldPikachu123!",
      password: "NewPikachu123!",
    });
    expect(result).toEqual({ message: "Password updated" });
  });

  it("throws the API's message when the current password is wrong", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "Password does not match" }), {
        status: 400,
      }),
    );

    await expect(
      authApi.changePassword("at-6", {
        currentPassword: "wrong",
        password: "NewPikachu123!",
      }),
    ).rejects.toThrow("Password does not match");
  });

  it("falls back to a default message when the change-password error body is not JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("gateway timeout", { status: 504 }));

    await expect(
      authApi.changePassword("at-6", {
        currentPassword: "OldPikachu123!",
        password: "NewPikachu123!",
      }),
    ).rejects.toThrow("Password change failed");
  });

  it("sends the bearer token when fetching the avatar", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({ image: "data:image/png;base64,AAA" }));

    const result = await authApi.getAvatar("at-7");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toMatch(/\/users\/avatar$/);
    expect(init?.headers).toEqual({ Authorization: "Bearer at-7" });
    expect(result).toEqual({ image: "data:image/png;base64,AAA" });
  });

  it("throws when the avatar fetch fails", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("nope", { status: 500 }));

    await expect(authApi.getAvatar("at-7")).rejects.toThrow("Failed to fetch avatar");
  });

  it("deletes the avatar with the bearer token", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({ message: "Avatar removed" }));

    const result = await authApi.deleteAvatar("at-7");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toMatch(/\/users\/avatar$/);
    expect(init?.method).toBe("DELETE");
    expect(init?.headers).toEqual({ Authorization: "Bearer at-7" });
    expect(result).toEqual({ message: "Avatar removed" });
  });

  it("throws when removing the avatar fails", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("nope", { status: 500 }));

    await expect(authApi.deleteAvatar("at-7")).rejects.toThrow("Failed to remove avatar");
  });

  it("clears the stored token on logout", async () => {
    setStoredToken("at-5");
    expect(getStoredToken()).toBe("at-5");

    await authApi.logout();

    expect(getStoredToken()).toBeNull();
  });
});

describe("requireStoredToken", () => {
  it("returns the stored token", () => {
    setStoredToken("at-6");

    expect(requireStoredToken()).toBe("at-6");
  });

  it("throws when no token is stored", () => {
    expect(() => requireStoredToken()).toThrow("No token provided");
  });
});

describe("authApi.uploadAvatar", () => {
  interface FakeXhrOptions {
    status?: number;
    responseText?: string;
    lengthComputable?: boolean;
    failWithNetworkError?: boolean;
  }

  const captured: {
    method?: string;
    url?: string;
    headers: Record<string, string>;
    body?: unknown;
  } = { headers: {} };

  const installFakeXhr = ({
    status = 200,
    responseText = JSON.stringify({ message: "Avatar updated" }),
    lengthComputable = true,
    failWithNetworkError = false,
  }: FakeXhrOptions = {}) => {
    captured.method = undefined;
    captured.url = undefined;
    captured.headers = {};
    captured.body = undefined;

    class FakeXhr {
      status = status;
      responseText = responseText;
      upload: { onprogress?: (event: ProgressEvent) => void } = {};
      onload?: () => void;
      onerror?: () => void;

      open(method: string, url: string) {
        captured.method = method;
        captured.url = url;
      }

      setRequestHeader(name: string, value: string) {
        captured.headers[name] = value;
      }

      send(body: unknown) {
        captured.body = body;
        this.upload.onprogress?.({
          lengthComputable,
          loaded: 50,
          total: 200,
        } as ProgressEvent);

        if (failWithNetworkError) {
          this.onerror?.();
          return;
        }
        this.onload?.();
      }
    }

    vi.stubGlobal("XMLHttpRequest", FakeXhr);
  };

  const file = new File([new Uint8Array([1, 2, 3])], "pikachu.png", {
    type: "image/png",
  });

  it("posts the file as FormData with the bearer token", async () => {
    installFakeXhr();

    const result = await authApi.uploadAvatar("at-8", file);

    expect(captured.method).toBe("POST");
    expect(captured.url).toMatch(/\/users\/avatar$/);
    expect(captured.headers.Authorization).toBe("Bearer at-8");
    expect(captured.body).toBeInstanceOf(FormData);
    expect((captured.body as FormData).get("file")).toBe(file);
    expect(result).toEqual({ message: "Avatar updated" });
  });

  it("never sets Content-Type itself", async () => {
    installFakeXhr();

    await authApi.uploadAvatar("at-8", file);

    expect(captured.headers).not.toHaveProperty("Content-Type");
    expect(Object.keys(captured.headers)).toEqual(["Authorization"]);
  });

  it("reports progress as a whole percentage", async () => {
    installFakeXhr({ lengthComputable: true });
    const onProgress = vi.fn();

    await authApi.uploadAvatar("at-8", file, onProgress);

    expect(onProgress).toHaveBeenCalledWith(25);
  });

  it("stays silent when the length is not computable", async () => {
    installFakeXhr({ lengthComputable: false });
    const onProgress = vi.fn();

    await authApi.uploadAvatar("at-8", file, onProgress);

    expect(onProgress).not.toHaveBeenCalled();
  });

  it("rejects with the API's message on a 4xx", async () => {
    installFakeXhr({
      status: 413,
      responseText: JSON.stringify({ message: "Avatar must be 500 KiB or smaller" }),
    });

    await expect(authApi.uploadAvatar("at-8", file)).rejects.toThrow(
      "Avatar must be 500 KiB or smaller",
    );
  });

  it("falls back to a default message when the error body is not JSON", async () => {
    installFakeXhr({ status: 502, responseText: "<html>bad gateway</html>" });

    await expect(authApi.uploadAvatar("at-8", file)).rejects.toThrow("Avatar upload failed");
  });

  it("rejects when the request fails at the network level", async () => {
    installFakeXhr({ failWithNetworkError: true });

    await expect(authApi.uploadAvatar("at-8", file)).rejects.toThrow("Avatar upload failed");
  });
});
