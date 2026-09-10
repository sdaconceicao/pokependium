/**
 * Vars the app refuses to start without. JWT_SECRET must match the auth
 * service that issues access tokens.
 */
const REQUIRED_ENV_VARS = ['JWT_SECRET'] as const;

export const validateEnv = (
  config: Record<string, unknown>,
): Record<string, unknown> => {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !String(config[key] ?? '').trim(),
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}`,
    );
  }

  return config;
};
