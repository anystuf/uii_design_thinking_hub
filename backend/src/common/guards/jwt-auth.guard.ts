import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { RequestWithUser } from '../types/request-with-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';

/**
 * Production authentication: verifies Supabase asymmetric JWTs against its JWKS.
 * Application roles are read exclusively from PostgreSQL; JWT user_metadata and
 * client-supplied headers are never trusted as authorization claims.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;

    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('A bearer access token is required.');
    }

    const issuer = this.config.get<string>('SUPABASE_JWT_ISSUER')?.replace(/\/$/, '');
    if (!issuer) {
      throw new ServiceUnavailableException('Authentication is not configured.');
    }

    let payload;
    try {
      const jwks = this.jwks ??= createRemoteJWKSet(
        new URL(issuer + '/.well-known/jwks.json'),
      );
      ({ payload } = await jwtVerify(authorization.slice(7), jwks, {
        issuer,
        audience: 'authenticated',
        algorithms: ['RS256', 'ES256'],
      }));

    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    const id = payload.sub;
      const email = typeof payload.email === 'string'
        ? payload.email.trim().toLowerCase()
        : '';
      if (!id || !email) {
        throw new UnauthorizedException('Token is missing identity claims.');
      }

      const metadata = payload.user_metadata as Record<string, unknown> | undefined;
      const displayName = [metadata?.full_name, metadata?.name].find(
        (value): value is string => typeof value === 'string' && value.trim().length > 0,
      ) ?? email.split('@')[0];

      // New accounts are STUDENT. Only an administrator or a trusted database
      // provisioning process may promote users to LECTURER / ADMIN.
      const user = await this.prisma.user.upsert({
        where: { id },
        create: { id, email, fullName: displayName, role: UserRole.STUDENT },
        update: { email, fullName: displayName },
        select: { id: true, email: true, fullName: true, role: true },
      });

      request.user = user;
      return true;
  }
}
