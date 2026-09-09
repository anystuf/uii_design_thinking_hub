import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { RequestWithUser } from '../types/request-with-user.type';

const VALID_ROLES = new Set<string>(Object.values(UserRole));

// TEMPORARY: Local development guard only.
// Replace this with Microsoft Entra ID JWT verification in the auth sprint.
@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const id = getSingleHeader(request.headers['x-user-id']);
    const email = getSingleHeader(request.headers['x-user-email']);
    const fullName = getSingleHeader(request.headers['x-user-name']);
    const role = getSingleHeader(request.headers['x-user-role']);

    if (!id || !email || !fullName || !role) {
      throw new UnauthorizedException('Missing development auth headers.');
    }

    if (!VALID_ROLES.has(role)) {
      throw new UnauthorizedException('Invalid development user role.');
    }

    request.user = {
      id,
      email,
      fullName,
      role: role as UserRole,
    };

    return true;
  }
}

function getSingleHeader(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? '';
  }

  return value?.trim() ?? '';
}
