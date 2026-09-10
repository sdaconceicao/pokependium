import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({ example: 'ash.ketchum@pallet.town' })
  email: string;

  @ApiProperty({ example: 'Pikachu123!' })
  password: string;
}
