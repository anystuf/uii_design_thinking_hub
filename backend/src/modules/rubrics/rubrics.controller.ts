import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateRubricDto, ReplaceCriteriaDto } from './dto/rubric.dto';
import { RubricsService } from './rubrics.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RubricsController {
  constructor(private readonly service: RubricsService) {}

  @Get('challenges/:id/rubrics')
  list(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.list(id, user);
  }

  @Get('rubrics/:id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.get(id, user);
  }

  @Post('challenges/:id/rubrics')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  create(
    @Param('id') id: string, @Body() dto: CreateRubricDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.create(id, dto, user); }

  @Put('rubric-versions/:id/criteria')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  replaceCriteria(
    @Param('id') id: string, @Body() dto: ReplaceCriteriaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.replaceCriteria(id, dto, user); }

  @Post('rubric-versions/:id/publish')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.publish(id, user);
  }

  @Post('rubrics/:id/versions')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  next(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.nextVersion(id, user);
  }
}
