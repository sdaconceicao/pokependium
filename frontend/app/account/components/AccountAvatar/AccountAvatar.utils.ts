import type { FileUploadItem } from "@code-x/lago";

/** Client-side copies of the API gate; the server is authoritative. */
export const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp";
export const AVATAR_MAX_BYTES = 512_000;

const STORED_AVATAR_ID = "stored-avatar";

/**
 * Build a FileUploadItem from a stored data URI so lago can show the current picture.
 * lago needs a File on every item; persisted avatars have none, so bytes are re-materialized.
 */
export function dataUriToUploadItem(dataUri: string): FileUploadItem {
  const [header, base64 = ""] = dataUri.split(",");
  const mimeType = header.match(/^data:([^;]+)/)?.[1] ?? "image/png";
  const binary = atob(base64);

  return {
    id: STORED_AVATAR_ID,
    file: new File(
      [Uint8Array.from(binary, (char) => char.charCodeAt(0))],
      `avatar.${mimeType.split("/")[1] ?? "png"}`,
      { type: mimeType },
    ),
    previewUrl: dataUri,
    status: "complete",
  };
}
