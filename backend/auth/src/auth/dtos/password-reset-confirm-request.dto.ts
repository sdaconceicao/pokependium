import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetConfirmRequestDto {
  @ApiProperty({
    description: 'Reset token from the emailed link',
  })
  token: string;

  @ApiProperty({
    example: 'Pikachu123!',
    minLength: 8,
    description:
      'Must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number, and a special character',
  })
  password: string;
}
