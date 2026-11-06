import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';

@Controller('health')
export class HealthController {
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
    } catch {
      throw new ServiceUnavailableException('Database connection is unavailable.');
    }

    return {
      status: 'ready',
      service: 'usi-design-thinking-hub-backend',
      database: 'connected',
    };
  }
}
