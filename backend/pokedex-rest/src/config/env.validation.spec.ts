import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const valid = {
    JWT_SECRET: 'secret',
  };

  it('returns the config unchanged when every required var is present', () => {
    const config = { ...valid, EXTRA: 'kept' };

    expect(validateEnv(config)).toEqual(config);
  });

  it('names every missing var in one error', () => {
    expect(() => validateEnv({})).toThrow(
      'Missing required environment variable(s): JWT_SECRET',
    );
  });

  it('treats blank and whitespace-only values as missing', () => {
    expect(() => validateEnv({ JWT_SECRET: '' })).toThrow('JWT_SECRET');
    expect(() => validateEnv({ JWT_SECRET: '   ' })).toThrow('JWT_SECRET');
  });

  it('does not mutate the config it is given', () => {
    const config = { ...valid };

    validateEnv(config);

    expect(config).toEqual(valid);
  });
});
