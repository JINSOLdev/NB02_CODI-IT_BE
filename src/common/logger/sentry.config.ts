import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function setupSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN, // Sentry 프로젝트 DSN
    environment: process.env.NODE_ENV || 'development',
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0, // 성능 트레이싱 비율 (0~1),
    profilesSampleRate: 1.0, // 프로파일링 비율 (0~1)
  });
}
