import { SetMetadata } from '@nestjs/common';

/**
 * `JwtGuard` resolves this handler-first, so `@Public(false)` on a method
 * re-guards a single route inside an otherwise `@Public()` controller.
 */
export const Public = (isPublic = true) => SetMetadata('isPublic', isPublic);
