import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
  @ApiProperty({
    example: 'ash.ketchum@pallet.town',
    description: 'Email address for the new account',
  })
  email: string;

  @ApiProperty({
    example: 'Pikachu123!',
    minLength: 8,
    description:
      'Must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number, and a special character',
  })
  password: string;
}
