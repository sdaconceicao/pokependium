import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordRequestDto {
  @ApiProperty({
    description: 'The password currently on the account, to prove ownership',
  })
  currentPassword: string;

  @ApiProperty({
    example: 'Pikachu123!',
    minLength: 8,
    description:
      'Must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number, and a special character, and must differ from the current password',
  })
  password: string;
}
