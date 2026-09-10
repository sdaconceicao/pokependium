import { ApiProperty } from '@nestjs/swagger';
import { AccessToken } from '../types/AccessToken';

export class PasswordResetConfirmResponseDTO implements AccessToken {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;
}
