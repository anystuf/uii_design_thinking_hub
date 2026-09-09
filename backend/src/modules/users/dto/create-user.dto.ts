import { UserRole } from '@prisma/client';

export type CreateUserDto = {
  email: string;
  fullName: string;
  role?: UserRole;
  microsoftId?: string;
};
