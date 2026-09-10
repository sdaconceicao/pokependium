import { UUID } from 'node:crypto';

export type AccessTokenPayload = {
  userId: UUID;
  email: string;
};
