import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ReviewAttemptDto, SaveExerciseDto, SubmitAttemptDto } from './dto/practice.dto';
import { PracticeService } from './practice.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PracticeController {
  constructor(private readonly practice: PracticeService) {}

  @Get('lessons/:lessonId/exercise')
  lessonExercise(@Param('lessonId') lessonId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.practice.getForLesson(lessonId, user);
  }

  @Put('lessons/:lessonId/exercise')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  save(@Param('lessonId') lessonId: string, @Body() dto: SaveExerciseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.practice.save(lessonId, dto, user);
  }

  @Post('exercises/:exerciseId/attempts')
  @Roles(UserRole.STUDENT)
  submit(@Param('exerciseId') exerciseId: string, @Body() dto: SubmitAttemptDto, @CurrentUser() user: AuthenticatedUser) {
    return this.practice.submit(exerciseId, dto, user);
  }

  @Get('exercises/:exerciseId/attempts/me')
  @Roles(UserRole.STUDENT)
  mine(@Param('exerciseId') exerciseId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.practice.mine(exerciseId, user);
  }

  @Get('exercises/:exerciseId/attempts')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  queue(@Param('exerciseId') exerciseId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.practice.reviewQueue(exerciseId, user);
  }

  @Patch('exercise-attempts/:attemptId/review')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  review(@Param('attemptId') attemptId: string, @Body() dto: ReviewAttemptDto, @CurrentUser() user: AuthenticatedUser) {
    return this.practice.review(attemptId, dto, user);
  }
}
