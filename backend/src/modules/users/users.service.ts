import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  createUser(data: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        role: data.role ?? UserRole.STUDENT,
        microsoftId: data.microsoftId,
      },
    });
  }

  updateUserRole(id: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (isPrismaConnectionError(error)) {
        return [];
      }

      throw error;
    }
  }
}

function isPrismaConnectionError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientKnownRequestError
  );
}
