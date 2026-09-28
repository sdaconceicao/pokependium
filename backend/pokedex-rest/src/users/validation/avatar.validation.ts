/** 500 KiB, measured on the decoded file — matches the DB's CK_user_avatars_size. */
export const AVATAR_MAX_BYTES = 512_000;

/** Raster only — an SVG served from this origin would be stored XSS. */
export const AVATAR_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

// Enough for the longest check: RIFF....WEBP needs 12.
const MIN_SIGNATURE_BYTES = 12;

export function resolveAvatarMimeType(data: Buffer): AvatarMimeType | null {
  if (data.length < MIN_SIGNATURE_BYTES) return null;

  if (data.subarray(0, 8).equals(PNG_SIGNATURE)) return 'image/png';
  if (data.subarray(0, 3).equals(JPEG_SIGNATURE)) return 'image/jpeg';

  // RIFF....WEBP; the container length is not parsed.
  if (
    data.subarray(0, 4).toString('ascii') === 'RIFF' &&
    data.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

export function isAvatarWithinSizeLimit(data: Buffer): boolean {
  return data.length > 0 && data.length <= AVATAR_MAX_BYTES;
}
