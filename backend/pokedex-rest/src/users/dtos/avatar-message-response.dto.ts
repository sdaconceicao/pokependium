import { ApiProperty } from '@nestjs/swagger';

export class AvatarMessageResponseDto {
  @ApiProperty({
    example: 'Avatar updated',
    description: 'Shared by the upload and delete responses',
  })
  message: string;
}
