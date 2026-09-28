import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { UserEntity } from '../users/users.entity';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ChangePasswordRequestDto } from './dtos/change-password-request.dto';
import { ChangePasswordResponseDTO } from './dtos/change-password-response.dto';
import {
  EmailVerificationConfirmRequestDto,
  EmailVerificationConfirmResponseDTO,
} from './dtos/email-verification-confirm.dto';
import { LoginRequestDto } from './dtos/login-request.dto';
import { LoginResponseDTO } from './dtos/login-response.dto';
import { PasswordResetConfirmRequestDto } from './dtos/password-reset-confirm-request.dto';
import { PasswordResetConfirmResponseDTO } from './dtos/password-reset-confirm-response.dto';
import { PasswordResetRequestDto } from './dtos/password-reset-request.dto';
import { PasswordResetResponseDTO } from './dtos/password-reset-response.dto';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { RegisterResponseDTO } from './dtos/register-response.dto';
import { AccessTokenPayload } from './types/AccessTokenPayload';
import { ChangePasswordValidationPipe } from './validation/change-password-validation.pipe';
import { PasswordResetValidationPipe } from './validation/password-reset-validation.pipe';
import { RegisterValidationPipe } from './validation/register-validation.pipe';

export interface AuthenticatedRequest extends FastifyRequest {
  user: UserEntity;
}

/** Routes behind `JwtGuard` get the decoded token, not a UserEntity. */
export interface JwtAuthenticatedRequest extends FastifyRequest {
  user: AccessTokenPayload;
}
@Public()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiBody({ type: LoginRequestDto })
  @ApiCreatedResponse({
    description: 'Successfully authenticated',
    type: LoginResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Unknown email or wrong password' })
  @ApiUnauthorizedResponse({ description: 'Missing credentials' })
  async login(
    @Request() req: AuthenticatedRequest,
  ): Promise<LoginResponseDTO | BadRequestException> {
    return this.authService.login(req.user);
  }
  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiCreatedResponse({
    description:
      'Always succeeds with an identical message, whether or not the address is already registered — the difference is conveyed only in the email sent',
    type: RegisterResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format or password that fails the policy',
  })
  async register(
    @Body(RegisterValidationPipe) registerBody: RegisterRequestDto,
    @Request() req: FastifyRequest,
  ): Promise<RegisterResponseDTO> {
    // Origin identifies which frontend deployment to link back to; the service
    // matches it against ALLOWED_ORIGINS before trusting it.
    return await this.authService.register(registerBody, req.headers.origin);
  }

  @Post('password-reset')
  @ApiOperation({ summary: 'Request a password reset link by email' })
  @ApiBody({ type: PasswordResetRequestDto })
  @ApiCreatedResponse({
    description:
      'Always succeeds with an identical message, whether or not the address is registered',
    type: PasswordResetResponseDTO,
  })
  async requestPasswordReset(
    @Body() body: PasswordResetRequestDto,
    @Request() req: FastifyRequest,
  ): Promise<PasswordResetResponseDTO> {
    // Origin identifies which frontend deployment to link back to; the service
    // matches it against ALLOWED_ORIGINS before trusting it.
    return this.authService.requestPasswordReset(
      body.email,
      req.headers.origin,
    );
  }

  @Post('password-reset/confirm')
  @ApiOperation({ summary: 'Set a new password using an emailed reset token' })
  @ApiBody({ type: PasswordResetConfirmRequestDto })
  @ApiCreatedResponse({
    description: 'Password updated and authenticated',
    type: PasswordResetConfirmResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired token, or password failed validation',
  })
  async confirmPasswordReset(
    @Body(PasswordResetValidationPipe) body: PasswordResetConfirmRequestDto,
  ): Promise<PasswordResetConfirmResponseDTO> {
    return this.authService.confirmPasswordReset(body.token, body.password);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify an account using an emailed link' })
  @ApiBody({ type: EmailVerificationConfirmRequestDto })
  @ApiCreatedResponse({
    description: 'Account verified and authenticated',
    type: EmailVerificationConfirmResponseDTO,
  })
  @ApiBadRequestResponse({
    description: 'Invalid, expired, or already-used verification link',
  })
  async confirmEmailVerification(
    @Body() body: EmailVerificationConfirmRequestDto,
  ): Promise<EmailVerificationConfirmResponseDTO> {
    return this.authService.confirmEmailVerification(body.token);
  }

  @Public(false)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change your password while signed in' })
  @ApiBody({ type: ChangePasswordRequestDto })
  @ApiCreatedResponse({
    description: 'Password updated',
    type: ChangePasswordResponseDTO,
  })
  @ApiBadRequestResponse({
    description:
      'Wrong current password, or a new password that fails the policy or matches the current one',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async changePassword(
    @Body(ChangePasswordValidationPipe) body: ChangePasswordRequestDto,
    @Request() req: JwtAuthenticatedRequest,
  ): Promise<ChangePasswordResponseDTO> {
    return this.authService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.password,
    );
  }
}
