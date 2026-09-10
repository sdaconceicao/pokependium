import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { RegisterRequestDto } from '../dtos/register-request.dto';
import { validateEmail, validatePassword } from './password.validation';

@Injectable()
export class RegisterValidationPipe implements PipeTransform {
  transform(value: RegisterRequestDto): RegisterRequestDto {
    const errors: string[] = [];

    // Validate email
    if (!value.email?.trim()) {
      errors.push('Email is required');
    } else if (!validateEmail(value.email.trim())) {
      errors.push('Please enter a valid email address');
    }

    // Validate password
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

    // Return cleaned data
    return {
      email: value.email.trim(),
      password: value.password,
    };
  }
}
