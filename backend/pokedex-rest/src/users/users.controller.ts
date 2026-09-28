import '@fastify/multipart';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  PayloadTooLargeException,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { AvatarsService } from './avatars.service';
import { AvatarMessageResponseDto } from './dtos/avatar-message-response.dto';
import { AvatarResponseDto } from './dtos/avatar-response.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { UsersService } from './users.service';
import {
  AVATAR_MAX_BYTES,
  isAvatarWithinSizeLimit,
  resolveAvatarMimeType,
} from './validation/avatar.validation';

interface JwtUser {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends FastifyRequest {
  user: JwtUser;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly avatarsService: AvatarsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiOkResponse({
    description: 'Profile of the authenticated user',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async getUser(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    // Fetch the complete user data from the database using the ID from JWT
    const user = await this.usersService.findOneById(req.user.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Return the complete user entity (excluding password) plus JWT fields
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      iat: req.user.iat,
      exp: req.user.exp,
    };
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Replace your avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    description: 'Avatar stored',
    type: AvatarMessageResponseDto,
  })
  @ApiPayloadTooLargeResponse({
    description: 'File exceeded the size ceiling while uploading',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
  ): Promise<AvatarMessageResponseDto> {
    const part = await req.file();
    if (!part) {
      throw new BadRequestException('No file was uploaded');
    }

    let data: Buffer;
    try {
      data = await part.toBuffer();
    } catch {
      // multipart aborts the stream once limits.fileSize is exceeded.
      throw new PayloadTooLargeException(
        `Avatar must be ${AVATAR_MAX_BYTES / 1024} KiB or smaller`,
      );
    }

    if (!isAvatarWithinSizeLimit(data)) {
      throw new BadRequestException('Avatar file is empty or too large');
    }

    // Bytes, not part.mimetype — the client controls that header.
    const mimeType = resolveAvatarMimeType(data);
    if (!mimeType) {
      throw new BadRequestException(
        'Avatar must be a PNG, JPEG, or WebP image',
      );
    }

    await this.avatarsService.upsert(req.user.userId, mimeType, data);
    return { message: 'Avatar updated' };
  }

  @Get('avatar')
  @ApiOperation({ summary: 'Get your avatar as a data URI' })
  @ApiOkResponse({
    description: 'The avatar as a data URI, or null when the account has none',
    type: AvatarResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async getAvatar(
    @Req() req: AuthenticatedRequest,
  ): Promise<AvatarResponseDto> {
    const avatar = await this.avatarsService.findOneByUserId(req.user.userId);
    if (!avatar) {
      return { image: null };
    }

    return {
      image: `data:${avatar.mimeType};base64,${avatar.data.toString('base64')}`,
    };
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Remove your avatar' })
  @ApiOkResponse({
    description: 'Avatar removed, or there was none to remove',
    type: AvatarMessageResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async deleteAvatar(
    @Req() req: AuthenticatedRequest,
  ): Promise<AvatarMessageResponseDto> {
    await this.avatarsService.remove(req.user.userId);
    return { message: 'Avatar removed' };
  }
}
