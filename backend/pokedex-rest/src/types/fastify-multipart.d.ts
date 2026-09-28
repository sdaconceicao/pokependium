import type { BusboyConfig } from '@fastify/busboy';

declare module 'fastify/types/request' {
  interface FastifyRequest {
    file: (options?: Omit<BusboyConfig, 'headers'>) => Promise<
      | {
          toBuffer: () => Promise<Buffer>;
          mimetype: string;
        }
      | undefined
    >;
  }
}
