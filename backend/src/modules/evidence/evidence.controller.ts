import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import {
  CreateIterationDto, CreateVersionedEvidenceDto, PresignUploadDto, ReviseEvidenceDto,
} from './dto/evidence.dto';
import { EvidenceService } from './evidence.service';
import { PrivateStorageService } from './private-storage.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidenceController {
  constructor(
    private readonly evidence: EvidenceService,
    private readonly storage: PrivateStorageService,
  ) {}

  @Post('projects/:id/uploads/presign')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  presign(
    @Param('id') id: string, @Body() dto: PresignUploadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.storage.presign(id, dto, user); }

  @Post('uploads/:id/complete')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  complete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.storage.complete(id, user);
  }

  @Get('file-assets/:id/download')
  download(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.storage.download(id, user);
  }

  @Get('projects/:id/versioned-evidence')
  list(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.evidence.list(id, user);
  }

  @Post('projects/:id/versioned-evidence')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  create(
    @Param('id') id: string, @Body() dto: CreateVersionedEvidenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.evidence.create(id, dto, user); }

  @Patch('versioned-evidence/:id')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  revise(
    @Param('id') id: string, @Body() dto: ReviseEvidenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.evidence.revise(id, dto, user); }

  @Get('projects/:id/iteration-notes')
  notes(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.evidence.notes(id, user);
  }

  @Post('projects/:id/iteration-notes')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  addNote(
    @Param('id') id: string, @Body() dto: CreateIterationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) { return this.evidence.addNote(id, dto, user); }
}
