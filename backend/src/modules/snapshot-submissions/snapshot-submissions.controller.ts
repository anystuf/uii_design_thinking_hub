import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { SubmitSnapshotDto } from './dto/submit-snapshot.dto';
import { SnapshotSubmissionsService } from './snapshot-submissions.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SnapshotSubmissionsController {
  constructor(private readonly service: SnapshotSubmissionsService) {}

  @Post('projects/:id/snapshot-submissions')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  submit(
    @Param('id') id: string, @Body() dto: SubmitSnapshotDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.submit(id, dto, user); }

  @Get('projects/:id/snapshot-submissions')
  list(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.list(id, user);
  }

  @Get('snapshot-submissions/:id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.get(id, user);
  }
}
