import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { LessonsService } from './lessons.service';

@Controller()
@UseGuards(DevAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('courses/:courseId/lessons')
  findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.findByCourse(courseId, user);
  }

  @Post('courses/:courseId/lessons')
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateLessonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.create(courseId, dto, user);
  }

  @Put('lessons/:id')
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.update(id, dto, user);
  }

  @Get('lessons/:id/progress')
  getProgress(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.getProgress(id, user);
  }

  @Put('lessons/:id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateLessonProgressDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.updateProgress(id, dto, user);
  }
  @Delete('lessons/:id')
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.delete(id, user);
  }
}

