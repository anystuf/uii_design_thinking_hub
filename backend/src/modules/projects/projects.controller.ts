import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateSprintStageDto } from './dto/update-sprint-stage.dto';
import { ProjectsService } from './projects.service';

@Controller()
@UseGuards(DevAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('projects')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findAll(user);
  }

  @Get('projects/:id')
  findById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findById(id, user);
  }

  @Post('projects')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.create(dto, user);
  }

  @Put('projects/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.update(id, dto, user);
  }

  @Delete('projects/:id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.delete(id, user);
  }

  @Post('projects/:id/submit')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  submit(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.submit(id, user);
  }

  @Get('projects/:id/submissions')
  findSubmissions(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.findSubmissions(id, user);
  }
  @Get('projects/:id/stages')
  findStages(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findStages(id, user);
  }

  @Patch('projects/:id/stages/:stage')
  updateStage(
    @Param('id') id: string,
    @Param('stage') stage: string,
    @Body() dto: UpdateSprintStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.updateStage(id, stage, dto, user);
  }

  @Get('projects/:id/evidence')
  findEvidence(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.findEvidence(id, user);
  }

  @Post('projects/:id/evidence')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  createEvidence(
    @Param('id') id: string,
    @Body() dto: CreateEvidenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.createEvidence(id, dto, user);
  }

  @Put('evidence/:id')
  updateEvidence(
    @Param('id') id: string,
    @Body() dto: UpdateEvidenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.updateEvidence(id, dto, user);
  }

  @Delete('evidence/:id')
  deleteEvidence(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.deleteEvidence(id, user);
  }

  @Get('projects/:id/feedback')
  findFeedback(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.findFeedback(id, user);
  }

  @Post('projects/:id/feedback')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  createFeedback(
    @Param('id') id: string,
    @Body() dto: CreateFeedbackDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.createFeedback(id, dto, user);
  }
}

