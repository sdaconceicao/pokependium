import { describe, expect, it } from 'vitest';
import {
  AVATAR_MAX_BYTES,
  isAvatarWithinSizeLimit,
  resolveAvatarMimeType,
} from './avatar.validation';

/** Pads a signature out past the 12-byte minimum the resolver requires. */
const withPadding = (...bytes: number[]) =>
  Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);

const PNG = withPadding(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const JPEG = withPadding(0xff, 0xd8, 0xff, 0xe0);
const WEBP = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
  Buffer.alloc(16),
]);

describe('resolveAvatarMimeType', () => {
  it('recognises a PNG by its signature', () => {
    expect(resolveAvatarMimeType(PNG)).toBe('image/png');
  });

  it('recognises a JPEG by its signature', () => {
    expect(resolveAvatarMimeType(JPEG)).toBe('image/jpeg');
  });

  it('recognises a WebP by its RIFF/WEBP pair', () => {
    expect(resolveAvatarMimeType(WEBP)).toBe('image/webp');
  });

  it('rejects an SVG, whatever the upload claims to be', () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      'utf8',
    );

    expect(resolveAvatarMimeType(svg)).toBeNull();
  });

  it('rejects a text blob that carries no image signature', () => {
    expect(
      resolveAvatarMimeType(Buffer.from('not an image at all', 'utf8')),
    ).toBeNull();
  });

  it('rejects a buffer too short to hold a signature', () => {
    expect(resolveAvatarMimeType(Buffer.from([0x89, 0x50, 0x4e]))).toBeNull();
  });

  it('rejects an empty buffer', () => {
    expect(resolveAvatarMimeType(Buffer.alloc(0))).toBeNull();
  });

  it('rejects RIFF that is not WEBP', () => {
    const wav = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0x24, 0x00, 0x00, 0x00]),
      Buffer.from('WAVE', 'ascii'),
      Buffer.alloc(16),
    ]);

    expect(resolveAvatarMimeType(wav)).toBeNull();
  });
});

describe('isAvatarWithinSizeLimit', () => {
  it('accepts a file at exactly the ceiling', () => {
    expect(isAvatarWithinSizeLimit(Buffer.alloc(AVATAR_MAX_BYTES))).toBe(true);
  });

  it('rejects a file one byte over the ceiling', () => {
    expect(isAvatarWithinSizeLimit(Buffer.alloc(AVATAR_MAX_BYTES + 1))).toBe(
      false,
    );
  });

  it('rejects an empty file', () => {
    expect(isAvatarWithinSizeLimit(Buffer.alloc(0))).toBe(false);
  });

  it('accepts an ordinary small file', () => {
    expect(isAvatarWithinSizeLimit(Buffer.alloc(1024))).toBe(true);
  });
});
