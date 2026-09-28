import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ChangePasswordRequestDto } from '../dtos/change-password-request.dto';
import { validatePassword } from './password.validation';

@Injectable()
export class ChangePasswordValidationPipe implements PipeTransform {
  transform(value: ChangePasswordRequestDto): ChangePasswordRequestDto {
    const errors: string[] = [];

    if (!value.currentPassword) {
      errors.push('Current password is required');
    }

    if (!value.password) {
      errors.push('New password is required');
    } else {
      const passwordValidation = validatePassword(value.password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }

    // Both values are plaintext here; a no-op change is rejected before hashing.
    if (value.currentPassword && value.password === value.currentPassword) {
      errors.push('New password must be different from the current password');
    }

    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    // Don't trim — login compares the raw input.
    return {
      currentPassword: value.currentPassword,
      password: value.password,
    };
  }
}
