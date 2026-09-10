import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const valid = {
    JWT_SECRET: 'secret',
    FRONTEND_BASE_URL: 'https://example.com',
    PRODUCT_NAME: 'TestApp',
  };

  it('returns the config unchanged when every required var is present', () => {
    const config = { ...valid, EXTRA: 'kept' };

    expect(validateEnv(config)).toEqual(config);
  });

  it('names every missing var in one error', () => {
    expect(() => validateEnv({})).toThrow(
      'Missing required environment variable(s): JWT_SECRET, FRONTEND_BASE_URL, PRODUCT_NAME',
    );
  });

  it('names only the var that is missing', () => {
    expect(() =>
      validateEnv({ JWT_SECRET: 'secret', FRONTEND_BASE_URL: 'https://x' }),
    ).toThrow('Missing required environment variable(s): PRODUCT_NAME');
  });

  it('treats blank and whitespace-only values as missing', () => {
    expect(() => validateEnv({ ...valid, FRONTEND_BASE_URL: '' })).toThrow(
      'FRONTEND_BASE_URL',
    );
    expect(() => validateEnv({ ...valid, JWT_SECRET: '   ' })).toThrow(
      'JWT_SECRET',
    );
  });

  it('does not mutate the config it is given', () => {
    const config = { ...valid };

    validateEnv(config);

    expect(config).toEqual(valid);
  });
});
