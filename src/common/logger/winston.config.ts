import * as winston from 'winston';

export const winstonConfig = {
  transports: [
    // 콘솔에 출력
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.colorize({ all: true }),
        winston.format.printf((info: winston.Logform.TransformableInfo) => {
          const { context, level, message, timestamp, stack } =
            info as unknown as {
              context?: string;
              level: string;
              message: string;
              timestamp?: string;
              stack?: string;
            };
          const contextStr = context || 'App';
          const logMessage = `[${timestamp || new Date().toISOString()}] [${contextStr}] ${level}: ${message}`;
          return stack ? `${logMessage}\n${stack}` : logMessage;
        }),
      ),
    }),
    // 로컬 로깅 db에 저장
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
        winston.format.printf((info: winston.Logform.TransformableInfo) => {
          const { context, level, message, timestamp, stack } =
            info as unknown as {
              context?: string;
              level: string;
              message: string;
              timestamp?: string;
              stack?: string;
            };
          const contextStr = context || 'App';
          const logMessage = `[${timestamp || new Date().toISOString()}] [${contextStr}] ${level}: ${message}`;
          return stack ? `${logMessage}\n${stack}` : logMessage;
        }),
      ),
    }),
  ],
};
