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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
@UseGuards(DevAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.findAll(user);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.findById(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  create(
    @Body() dto: CreateCourseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.create(dto, user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.delete(id, user);
  }

  @Post(':id/enroll')
  @Roles(UserRole.STUDENT)
  enroll(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.enroll(id, user);
  }
}
