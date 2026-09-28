import { describe, expect, it } from 'vitest';
import {
  isAllowedOrigin,
  parseAllowedOrigins,
  toOriginMatcher,
} from './allowed-origins';

describe('toOriginMatcher', () => {
  it('returns an exact origin unchanged', () => {
    expect(toOriginMatcher('http://localhost:3010')).toBe(
      'http://localhost:3010',
    );
  });

  it('compiles a wildcard entry to a regex matching one hostname label', () => {
    const matcher = toOriginMatcher('https://pokedex-frontend-*.vercel.app');

    expect(matcher).toBeInstanceOf(RegExp);
    // Anchored, with the literal dots escaped so they cannot match any char.
    expect((matcher as RegExp).source).toBe(
      '^https:\\/\\/pokedex-frontend-[a-zA-Z0-9-]+\\.vercel\\.app$',
    );
  });

  it('escapes regex metacharacters in the literal parts', () => {
    const matcher = toOriginMatcher('https://a+b(c)-*.example.com');

    expect((matcher as RegExp).source).toBe(
      '^https:\\/\\/a\\+b\\(c\\)-[a-zA-Z0-9-]+\\.example\\.com$',
    );
  });

  it('is deterministic for the same input', () => {
    expect(toOriginMatcher('https://a-*.vercel.app')).toEqual(
      toOriginMatcher('https://a-*.vercel.app'),
    );
  });
});

describe('parseAllowedOrigins', () => {
  it('splits a comma-separated list and trims whitespace', () => {
    expect(
      parseAllowedOrigins('http://localhost:3010, https://example.com'),
    ).toEqual(['http://localhost:3010', 'https://example.com']);
  });

  it('drops empty entries left by stray commas', () => {
    expect(parseAllowedOrigins('http://localhost:3010,,')).toEqual([
      'http://localhost:3010',
    ]);
  });

  it('falls back to the local frontend when unset or blank', () => {
    expect(parseAllowedOrigins()).toEqual(['http://localhost:3010']);
    expect(parseAllowedOrigins('')).toEqual(['http://localhost:3010']);
    expect(parseAllowedOrigins('  ,  ')).toEqual(['http://localhost:3010']);
  });
});

describe('isAllowedOrigin', () => {
  const matchers = parseAllowedOrigins(
    'https://pokedex-frontend.vercel.app,https://pokedex-frontend-*.vercel.app',
  );

  it('accepts an exact match', () => {
    expect(
      isAllowedOrigin('https://pokedex-frontend.vercel.app', matchers),
    ).toBe(true);
  });

  it('accepts Vercel deployment and branch preview URLs', () => {
    // Both forms are a single hostname label, dashes and all.
    expect(
      isAllowedOrigin(
        'https://pokedex-frontend-k2n4xq9zb-code-x.vercel.app',
        matchers,
      ),
    ).toBe(true);
    expect(
      isAllowedOrigin(
        'https://pokedex-frontend-git-feat-password-reset-code-x.vercel.app',
        matchers,
      ),
    ).toBe(true);
  });

  it('rejects an origin a wildcard would only match across a dot', () => {
    expect(
      isAllowedOrigin('https://pokedex-frontend-evil.attacker.app', matchers),
    ).toBe(false);
    expect(
      isAllowedOrigin('https://pokedex-frontend-x.evil.vercel.app', matchers),
    ).toBe(false);
  });

  it('rejects an unrelated origin, a prefix, and a suffix', () => {
    expect(isAllowedOrigin('https://attacker.example', matchers)).toBe(false);
    expect(
      isAllowedOrigin('https://pokedex-frontend.vercel.app.evil.com', matchers),
    ).toBe(false);
    expect(
      isAllowedOrigin(
        'https://evil.com/https://pokedex-frontend.vercel.app',
        matchers,
      ),
    ).toBe(false);
  });

  it('rejects a missing or empty Origin header', () => {
    expect(isAllowedOrigin(undefined, matchers)).toBe(false);
    expect(isAllowedOrigin('', matchers)).toBe(false);
  });

  it('rejects everything when no matcher is configured', () => {
    expect(isAllowedOrigin('http://localhost:3010', [])).toBe(false);
  });
});
