/** Used when ALLOWED_ORIGINS is unset, matching the local frontend dev server. */
const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:3010';

/**
 * Turns one configured entry into a matcher. Entries may contain '*' wildcards
 * (e.g. https://pokedex-frontend-*.vercel.app for Vercel preview deployments);
 * a wildcard matches a single hostname label and cannot cross a '.', so it
 * can't be widened to unrelated domains.
 */
export const toOriginMatcher = (origin: string): string | RegExp =>
  origin.includes('*')
    ? new RegExp(
        `^${origin
          .split('*')
          .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('[a-zA-Z0-9-]+')}$`,
      )
    : origin;

/** Parses a raw ALLOWED_ORIGINS value into CORS-ready matchers. */
export const parseAllowedOrigins = (raw?: string): (string | RegExp)[] => {
  const entries = raw
    ? raw
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    : [];

  return (entries.length > 0 ? entries : [DEFAULT_ALLOWED_ORIGIN]).map(
    toOriginMatcher,
  );
};

/**
 * Whether a request's Origin header is one of the configured origins. Narrows
 * to `string` so callers can use the header to build a URL only on the branch
 * where it has been checked.
 */
export const isAllowedOrigin = (
  origin: string | undefined,
  matchers: readonly (string | RegExp)[],
): origin is string =>
  !!origin &&
  matchers.some((matcher) =>
    typeof matcher === 'string' ? matcher === origin : matcher.test(origin),
  );
