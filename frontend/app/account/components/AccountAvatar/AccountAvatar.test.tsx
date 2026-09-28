import type { FileUploadItem } from "@code-x/lago";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAvatar } from "@/hooks/useAvatar";
import { notify } from "@/lib/toast";
import AccountAvatar from "./AccountAvatar";

vi.mock("@/hooks/useAvatar", () => ({ useAvatar: vi.fn() }));
vi.mock("@/lib/toast", () => ({ notify: vi.fn() }));

const PICKED: FileUploadItem = {
  id: "picked-1",
  file: new File([new Uint8Array([1, 2, 3])], "pikachu.png", { type: "image/png" }),
  previewUrl: "blob:picked",
  status: "idle",
};

// Stub FileUploader so these tests cover wiring, not lago's drop zone.
vi.mock("@code-x/lago", () => ({
  FileUploader: ({
    value,
    onChange,
    onReject,
    onRemove,
    onRetry,
    errorMessage,
    isDisabled,
  }: {
    value: FileUploadItem[];
    onChange: (items: FileUploadItem[]) => void;
    onReject: (files: File[], reason: "accept" | "maxSize") => void;
    onRemove: (item: FileUploadItem) => void;
    onRetry: (item: FileUploadItem) => void;
    errorMessage?: string;
    isDisabled?: boolean;
  }) => (
    <div>
      <span data-testid="item-state">
        {value[0] ? `${value[0].status}:${value[0].progress ?? ""}` : "empty"}
      </span>
      <span data-testid="item-error">{value[0]?.errorMessage ?? ""}</span>
      <span data-testid="item-name">{value[0]?.file.name ?? ""}</span>
      <span data-testid="field-error">{errorMessage ?? ""}</span>
      <span data-testid="disabled">{String(!!isDisabled)}</span>
      <button type="button" onClick={() => onChange([PICKED])}>
        pick
      </button>
      <button type="button" onClick={() => onReject([PICKED.file], "maxSize")}>
        reject-size
      </button>
      <button type="button" onClick={() => onReject([PICKED.file], "accept")}>
        reject-type
      </button>
      <button type="button" onClick={() => onRemove(PICKED)}>
        remove
      </button>
      <button type="button" onClick={() => onRetry(PICKED)}>
        retry
      </button>
    </div>
  ),
}));

const DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

const setAvatar = (overrides: Partial<ReturnType<typeof useAvatar>> = {}) =>
  vi.mocked(useAvatar).mockReturnValue({
    avatarSrc: undefined,
    isLoading: false,
    error: null,
    uploadAvatarAsync: vi.fn().mockResolvedValue({ message: "Avatar updated" }),
    isUploadLoading: false,
    removeAvatarAsync: vi.fn().mockResolvedValue({ message: "Avatar removed" }),
    isRemoveLoading: false,
    ...overrides,
  } as unknown as ReturnType<typeof useAvatar>);

beforeEach(() => {
  vi.clearAllMocks();
  setAvatar();
});

describe("AccountAvatar", () => {
  it("starts empty when the account has no avatar", () => {
    render(<AccountAvatar />);

    expect(screen.getByTestId("item-state")).toHaveTextContent("empty");
  });

  it("hydrates the stored avatar into the uploader", async () => {
    setAvatar({ avatarSrc: DATA_URI });

    render(<AccountAvatar />);

    await waitFor(() => expect(screen.getByTestId("item-state")).toHaveTextContent("complete"));
    expect(screen.getByTestId("item-name")).toHaveTextContent("avatar.png");
  });

  it("hydrates when the avatar arrives after the first render", async () => {
    setAvatar({ avatarSrc: undefined });
    const { rerender } = render(<AccountAvatar />);
    expect(screen.getByTestId("item-state")).toHaveTextContent("empty");

    setAvatar({ avatarSrc: DATA_URI });
    rerender(<AccountAvatar />);

    await waitFor(() => expect(screen.getByTestId("item-state")).toHaveTextContent("complete"));
  });

  it("uploads a picked file and marks it complete", async () => {
    const uploadAvatarAsync = vi.fn().mockResolvedValue({ message: "Avatar updated" });
    setAvatar({ uploadAvatarAsync });
    const user = userEvent.setup();

    render(<AccountAvatar />);
    await user.click(screen.getByRole("button", { name: "pick" }));

    expect(uploadAvatarAsync).toHaveBeenCalledWith(expect.objectContaining({ file: PICKED.file }));
    await waitFor(() => expect(screen.getByTestId("item-state")).toHaveTextContent("complete:100"));
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Avatar updated", variant: "success" }),
    );
  });

  it("threads upload progress into the item while the request is open", async () => {
    let release: (value: { message: string }) => void = () => {};
    const uploadAvatarAsync = vi.fn(
      ({ onProgress }: { onProgress?: (percent: number) => void }) => {
        onProgress?.(42);
        return new Promise<{ message: string }>((resolve) => {
          release = resolve;
        });
      },
    );
    setAvatar({ uploadAvatarAsync });
    const user = userEvent.setup();

    render(<AccountAvatar />);
    await user.click(screen.getByRole("button", { name: "pick" }));

    await waitFor(() => expect(screen.getByTestId("item-state")).toHaveTextContent("uploading:42"));

    release({ message: "Avatar updated" });
    await waitFor(() => expect(screen.getByTestId("item-state")).toHaveTextContent("complete:100"));
  });

  it("leaves a failed upload in the error state with the API's message", async () => {
    setAvatar({
      uploadAvatarAsync: vi.fn().mockRejectedValue(new Error("Avatar must be 500 KiB or smaller")),
    });
    const user = userEvent.setup();

    render(<AccountAvatar />);
    await user.click(screen.getByRole("button", { name: "pick" }));

    await waitFor(() => expect(screen.getByTestId("item-state")).toHaveTextContent("error"));
    expect(screen.getByTestId("item-error")).toHaveTextContent("Avatar must be 500 KiB or smaller");
  });

  it("re-uploads on retry", async () => {
    const uploadAvatarAsync = vi.fn().mockResolvedValue({ message: "Avatar updated" });
    setAvatar({ uploadAvatarAsync });
    const user = userEvent.setup();

    render(<AccountAvatar />);
    await user.click(screen.getByRole("button", { name: "retry" }));

    expect(uploadAvatarAsync).toHaveBeenCalledWith(expect.objectContaining({ file: PICKED.file }));
  });

  it("explains an oversized file", async () => {
    const user = userEvent.setup();
    render(<AccountAvatar />);

    await user.click(screen.getByRole("button", { name: "reject-size" }));

    expect(screen.getByTestId("field-error")).toHaveTextContent("Image must be 500 KiB or smaller");
  });

  it("explains an unsupported format", async () => {
    const user = userEvent.setup();
    render(<AccountAvatar />);

    await user.click(screen.getByRole("button", { name: "reject-type" }));

    expect(screen.getByTestId("field-error")).toHaveTextContent(
      "Image must be a PNG, JPEG, or WebP",
    );
  });

  it("removes the avatar and clears the uploader", async () => {
    const removeAvatarAsync = vi.fn().mockResolvedValue({ message: "Avatar removed" });
    setAvatar({ avatarSrc: DATA_URI, removeAvatarAsync });
    const user = userEvent.setup();

    const { rerender } = render(<AccountAvatar />);
    await waitFor(() => expect(screen.getByTestId("item-state")).toHaveTextContent("complete"));

    await user.click(screen.getByRole("button", { name: "remove" }));

    expect(removeAvatarAsync).toHaveBeenCalledTimes(1);

    setAvatar({ avatarSrc: undefined, removeAvatarAsync });
    rerender(<AccountAvatar />);

    await waitFor(() => expect(screen.getByTestId("item-state")).toHaveTextContent("empty"));
  });

  it("toasts a failed removal and keeps the avatar", async () => {
    setAvatar({
      avatarSrc: DATA_URI,
      removeAvatarAsync: vi.fn().mockRejectedValue(new Error("Failed to remove avatar")),
    });
    const user = userEvent.setup();

    render(<AccountAvatar />);
    await waitFor(() => expect(screen.getByTestId("item-state")).toHaveTextContent("complete"));

    await user.click(screen.getByRole("button", { name: "remove" }));

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Failed to remove avatar", variant: "error" }),
      ),
    );
    expect(screen.getByTestId("item-state")).toHaveTextContent("complete");
  });

  it("disables the uploader while a request is in flight", () => {
    setAvatar({ isUploadLoading: true });

    render(<AccountAvatar />);

    expect(screen.getByTestId("disabled")).toHaveTextContent("true");
  });
});
