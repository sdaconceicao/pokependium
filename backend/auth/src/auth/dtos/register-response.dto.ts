import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDTO {
  @ApiProperty({
    example: 'Check your email for a link to verify your account',
    description:
      'Registration does not authenticate: the account cannot sign in until the emailed link is used',
  })
  message: string;
}
