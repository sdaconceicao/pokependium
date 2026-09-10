import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { PasswordResetConfirmRequestDto } from '../dtos/password-reset-confirm-request.dto';
import { validatePassword } from './password.validation';

@Injectable()
export class PasswordResetValidationPipe implements PipeTransform {
  transform(
    value: PasswordResetConfirmRequestDto,
  ): PasswordResetConfirmRequestDto {
    const errors: string[] = [];

    if (!value.token?.trim()) {
      errors.push('Reset token is required');
    }

    if (!value.password) {
      errors.push('Password is required');
    } else {
      const passwordValidation = validatePassword(value.password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    return {
      token: value.token.trim(),
      password: value.password,
    };
  }
}
