import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { PasswordResetValidationPipe } from './password-reset-validation.pipe';

describe('PasswordResetValidationPipe', () => {
  let pipe: PasswordResetValidationPipe;

  beforeEach(() => {
    pipe = new PasswordResetValidationPipe();
  });

  it('returns the token trimmed and the password untouched', () => {
    const result = pipe.transform({
      token: '  jwt-token-123  ',
      password: 'Pikachu123!',
    });

    expect(result).toEqual({
      token: 'jwt-token-123',
      password: 'Pikachu123!',
    });
  });

  it('rejects a missing token', () => {
    expect(() =>
      pipe.transform({ token: '', password: 'Pikachu123!' }),
    ).toThrow(BadRequestException);
  });

  it('rejects a whitespace-only token', () => {
    expect(() =>
      pipe.transform({ token: '   ', password: 'Pikachu123!' }),
    ).toThrow(BadRequestException);
  });

  it('rejects a password that fails the shared policy', () => {
    expect(() =>
      pipe.transform({ token: 'jwt-token-123', password: 'weak' }),
    ).toThrow(BadRequestException);
  });

  it('reports token and password problems together', () => {
    try {
      pipe.transform({ token: '', password: 'weak' });
      expect.unreachable('expected BadRequestException');
    } catch (error) {
      const response = (error as BadRequestException).getResponse() as {
        message: string;
        errors: string[];
      };
      expect(response.message).toBe('Validation failed');
      expect(response.errors).toContain('Reset token is required');
      expect(response.errors).toContain(
        'Password must be at least 8 characters long',
      );
    }
  });
});
