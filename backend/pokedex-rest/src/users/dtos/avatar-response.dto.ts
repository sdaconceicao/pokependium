import { ApiProperty } from '@nestjs/swagger';

export class AvatarResponseDto {
  @ApiProperty({
    nullable: true,
    example: 'data:image/png;base64,iVBORw0KGgo...',
    description:
      'The avatar as a data URI, or null when the account has none — deliberately not a 404, so having no avatar is not an error case for the client',
  })
  image: string | null;
}
