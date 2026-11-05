import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import {
  CreateProjectTaskDto, CreateTeamDto, InviteTeamMemberDto,
  RespondInvitationDto, UpdateProjectTaskDto,
} from './dto/team.dto';
import { TeamsService } from './teams.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get('teams/my')
  @Roles(UserRole.STUDENT)
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.mine(user);
  }

  @Get('team-invitations/my')
  @Roles(UserRole.STUDENT)
  invitations(@CurrentUser() user: AuthenticatedUser) {
    return this.service.invitations(user);
  }

  @Post('team-invitations/:id/respond')
  @Roles(UserRole.STUDENT)
  respond(
    @Param('id') id: string,
    @Body() dto: RespondInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.respond(id, dto, user); }

  @Get('challenges/:id/teams')
  list(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.list(id, user);
  }

  @Post('challenges/:id/teams')
  @Roles(UserRole.STUDENT)
  create(
    @Param('id') id: string,
    @Body() dto: CreateTeamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.create(id, dto, user); }

  @Get('teams/:id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.get(id, user);
  }

  @Post('teams/:id/invitations')
  @Roles(UserRole.STUDENT)
  invite(
    @Param('id') id: string,
    @Body() dto: InviteTeamMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.invite(id, dto, user); }

  @Get('teams/:id/tasks')
  tasks(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.tasks(id, user);
  }

  @Post('teams/:id/tasks')
  @Roles(UserRole.STUDENT)
  createTask(
    @Param('id') id: string,
    @Body() dto: CreateProjectTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.createTask(id, dto, user); }

  @Patch('teams/:id/tasks/:taskId')
  @Roles(UserRole.STUDENT)
  updateTask(
    @Param('id') id: string, @Param('taskId') taskId: string,
    @Body() dto: UpdateProjectTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.updateTask(id, taskId, dto, user); }
}
