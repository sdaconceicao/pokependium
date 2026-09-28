import { AVATAR_ACCEPT, AVATAR_MAX_BYTES, dataUriToUploadItem } from "./AccountAvatar.utils";

const PNG_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

describe("avatar constants", () => {
  it("matches the server's ceiling and formats", () => {
    expect(AVATAR_MAX_BYTES).toBe(512_000);
    expect(AVATAR_ACCEPT).toBe("image/png,image/jpeg,image/webp");
  });
});

describe("dataUriToUploadItem", () => {
  it("materialises the stored bytes as a File", () => {
    const item = dataUriToUploadItem(PNG_DATA_URI);

    expect(item.file).toBeInstanceOf(File);
    expect(item.file.type).toBe("image/png");
    expect(item.file.size).toBeGreaterThan(0);
  });

  it("names the file from the data URI's subtype", () => {
    const item = dataUriToUploadItem(PNG_DATA_URI);

    expect(item.file.name).toBe("avatar.png");
  });

  it("reuses the data URI as the preview rather than an object URL", () => {
    const item = dataUriToUploadItem(PNG_DATA_URI);

    expect(item.previewUrl).toBe(PNG_DATA_URI);
  });

  it("marks the stored avatar complete so it sits in the circle", () => {
    const item = dataUriToUploadItem(PNG_DATA_URI);

    expect(item.status).toBe("complete");
  });

  it("gives the item a stable id across calls", () => {
    const first = dataUriToUploadItem(PNG_DATA_URI);
    const second = dataUriToUploadItem(PNG_DATA_URI);

    expect(first.id).toBe(second.id);
  });
});
