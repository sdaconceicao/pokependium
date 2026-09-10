import { ApiProperty } from '@nestjs/swagger';
import { AccessToken } from '../types/AccessToken';

export class LoginResponseDTO implements AccessToken {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;
}
