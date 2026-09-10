import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChangePasswordValidationPipe } from './change-password-validation.pipe';

describe('ChangePasswordValidationPipe', () => {
  let pipe: ChangePasswordValidationPipe;

  beforeEach(() => {
    pipe = new ChangePasswordValidationPipe();
  });

  const VALID = {
    currentPassword: 'OldPikachu123!',
    password: 'NewPikachu123!',
  };

  it('returns both passwords untouched', () => {
    expect(pipe.transform({ ...VALID })).toEqual(VALID);
  });

  it('preserves surrounding whitespace in a password', () => {
    const padded = { currentPassword: '  Old123!  ', password: '  New123!  ' };

    expect(pipe.transform({ ...padded })).toEqual(padded);
  });

  it('rejects a missing current password', () => {
    expect(() =>
      pipe.transform({ currentPassword: '', password: 'NewPikachu123!' }),
    ).toThrow(BadRequestException);
  });

  it('rejects a missing new password', () => {
    expect(() =>
      pipe.transform({ currentPassword: 'OldPikachu123!', password: '' }),
    ).toThrow(BadRequestException);
  });

  it('rejects a new password that fails the shared policy', () => {
    expect(() =>
      pipe.transform({ currentPassword: 'OldPikachu123!', password: 'weak' }),
    ).toThrow(BadRequestException);
  });

  it('rejects a new password identical to the current one', () => {
    try {
      pipe.transform({
        currentPassword: 'Pikachu123!',
        password: 'Pikachu123!',
      });
      expect.unreachable('expected BadRequestException');
    } catch (error) {
      const response = (error as BadRequestException).getResponse() as {
        errors: string[];
      };
      expect(response.errors).toContain(
        'New password must be different from the current password',
      );
    }
  });

  it('reports current-password and policy problems together', () => {
    try {
      pipe.transform({ currentPassword: '', password: 'weak' });
      expect.unreachable('expected BadRequestException');
    } catch (error) {
      const response = (error as BadRequestException).getResponse() as {
        message: string;
        errors: string[];
      };
      expect(response.message).toBe('Validation failed');
      expect(response.errors).toContain('Current password is required');
      expect(response.errors).toContain(
        'Password must be at least 8 characters long',
      );
    }
  });
});
