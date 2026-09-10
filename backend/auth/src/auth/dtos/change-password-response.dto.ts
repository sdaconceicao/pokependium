import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordResponseDTO {
  @ApiProperty({
    example: 'Password updated',
    description:
      'Returned only on success; a wrong current password is a 400 instead',
  })
  message: string;
}
