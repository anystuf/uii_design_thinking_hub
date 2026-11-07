import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  // Process liveness; useful for basic diagnostics without a database dependency.
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'usi-design-thinking-hub-backend',
    };
  }

  // Deployment readiness must fail when PostgreSQL is unreachable.
  // No database credentials or SQL errors are returned to callers.
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error: unknown) {
      // Never log the raw error: Prisma messages may contain connection details.
      const details =
        error !== null && typeof error === 'object'
          ? (error as { code?: unknown; name?: unknown })
          : {};
      // Initialization errors may carry the actionable Prisma code only in
      // their message. Inspect it in memory but never print it.
      const message =
        error instanceof Error && typeof error.message === 'string'
          ? error.message
          : '';
      const embeddedCode = message.match(/\\bP10\\d{2}\\b/)?.[0];
      const code =
        typeof details.code === 'string' ? details.code : embeddedCode ?? 'UNKNOWN';
      const name = typeof details.name === 'string' ? details.name : 'UnknownError';
      const category =
        code === 'P1000'
          ? 'authentication_failed'
          : code === 'P1001'
            ? 'database_unreachable'
            : code === 'P1002'
              ? 'database_timeout'
              : code === 'P1013'
                ? 'invalid_connection_string'
                : code === 'P1017'
                  ? 'connection_closed'
                  : /authentication failed|password authentication failed|invalid credentials/i.test(message)
                    ? 'authentication_failed'
                    : /can't reach database server|could not connect|connection refused|name or service not known|dns/i.test(message)
                      ? 'database_unreachable'
                      : /timed out|timeout/i.test(message)
                        ? 'database_timeout'
                        : /invalid.*(connection string|database url|port)|invalid url|url must start/i.test(message)
                          ? 'invalid_connection_string'
                          : /tenant or user not found/i.test(message)
                            ? 'pooler_user_or_tenant_not_found'
                            : /certificate|tls|ssl/i.test(message)
                              ? 'tls_connection_error'
                              : 'unclassified_database_error';

      this.logger.error(
        `Database readiness check failed: code=${code} type=${name} category=${category}`,
      );
      throw new ServiceUnavailableException('Database connection is unavailable.');
    }

    return {
      status: 'ready',
      service: 'usi-design-thinking-hub-backend',
      database: 'connected',
    };
  }
}
