import { registerAs } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

export interface LoggingConfig {
  level: string;
  directory: string;
  maxSize: string;
  maxFiles: string;
  filename: string;
}

export default registerAs<LoggingConfig>('logging', () => ({
  level: process.env.LOG_LEVEL || 'info',
  directory: process.env.LOG_DIRECTORY || 'logs',
  maxSize: process.env.LOG_MAX_SIZE || '100m',
  maxFiles: process.env.LOG_MAX_FILES || '7d',
  filename: process.env.LOG_FILENAME || 'application-%DATE%.log',
}));

export const createWinstonLogger = (config: LoggingConfig) => {
  const { level, directory, maxSize, maxFiles, filename } = config;
  const isServerless =
    process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

  const transports: winston.transport[] = [
    new winston.transports.Console({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('AuthAPI', {
          prettyPrint: true,
          colors: true,
        }),
      ),
    }),
  ];

  if (!isServerless) {
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: `${directory}/${filename}`,
        datePattern: 'YYYY-MM-DD',
        maxSize,
        maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        zippedArchive: true,
        handleExceptions: true,
        handleRejections: true,
      }),
    );
  }

  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports,
    exitOnError: false,
  });
};
