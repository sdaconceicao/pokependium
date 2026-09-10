import { ApiProperty } from '@nestjs/swagger';
import { AccessToken } from '../types/AccessToken';

export class EmailVerificationConfirmRequestDto {
  @ApiProperty({ description: 'Verification token from the emailed link' })
  token: string;
}

export class EmailVerificationConfirmResponseDTO implements AccessToken {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;
}
