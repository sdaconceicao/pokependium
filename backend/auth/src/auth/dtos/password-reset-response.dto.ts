import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetResponseDTO {
  @ApiProperty({
    example:
      'If an account exists for that address, a reset link has been sent',
    description:
      'Always identical whether or not the address is registered, so the endpoint cannot be used to enumerate accounts',
  })
  message: string;
}
