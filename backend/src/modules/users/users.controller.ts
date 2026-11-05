import {
  Controller,
  Get,
  NotFoundException,
  ForbiddenException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() current: AuthenticatedUser) {
    if (current.id !== id && current.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Cannot access another user profile.');
    }
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }
}
