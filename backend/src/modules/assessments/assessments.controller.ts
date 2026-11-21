import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PublishAssessmentDto } from './dto/publish-assessment.dto';
import { AssessmentsService } from './assessments.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  @Get('assessments/queue')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  queue(@CurrentUser() user: AuthenticatedUser) {
    return this.service.queue(user);
  }

  @Post('snapshot-submissions/:id/assessment')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  publish(
    @Param('id') id: string,
    @Body() dto: PublishAssessmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.service.publish(id, dto, user); }

  @Get('snapshot-submissions/:id/assessment')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.get(id, user);
  }
}
