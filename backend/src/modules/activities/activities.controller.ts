import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ActivitiesService } from './activities.service';
import {
  AssignChallengeActivityDto, CreateProjectActivityDto, UpdateProjectActivityDto,
} from './dto/activity.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get('activity-templates')
  templates(@Query('mode') mode?: string) { return this.service.templates(mode); }

  @Get('challenges/:id/activities')
  assigned(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.assigned(id, user);
  }

  @Post('challenges/:id/activities')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  assign(
    @Param('id') id: string,
    @Body() dto: AssignChallengeActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.assign(id, dto, user); }

  @Get('projects/:id/activities')
  projectActivities(
    @Param('id') id: string, @CurrentUser() user: AuthenticatedUser,
    @Query('mode') mode?: string,
  ) { return this.service.projectActivities(id, user, mode); }

  @Post('projects/:id/activities')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  start(
    @Param('id') id: string,
    @Body() dto: CreateProjectActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.start(id, dto, user); }

  @Patch('project-activities/:id')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.update(id, dto, user); }
}
