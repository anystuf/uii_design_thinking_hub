import {
  Body, Controller, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto, CreateMilestoneDto, UpdateChallengeDto } from './dto/challenge.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChallengesController {
  constructor(private readonly service: ChallengesService) {}

  @Get('courses/:courseId/challenges')
  list(@Param('courseId') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.list(id, user);
  }

  @Post('courses/:courseId/challenges')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  create(
    @Param('courseId') id: string,
    @Body() dto: CreateChallengeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.create(id, dto, user); }

  @Get('challenges/:id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.get(id, user);
  }

  @Patch('challenges/:id')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChallengeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.update(id, dto, user); }

  @Post('challenges/:id/milestones')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  addMilestone(
    @Param('id') id: string,
    @Body() dto: CreateMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.addMilestone(id, dto, user); }

  @Get('challenges/:id/milestones')
  milestones(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.milestones(id, user);
  }
}
