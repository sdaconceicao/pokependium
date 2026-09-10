/**
 * Vars the app refuses to start without. Checked at boot because both are read
 * lazily — FRONTEND_BASE_URL only when an email goes out — so a deploy missing
 * one would pass its health check and fail later, on a password reset request.
 */
const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'FRONTEND_BASE_URL',
  'PRODUCT_NAME',
] as const;

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
