import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReactionType } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CommunityService } from './community.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { SetReactionDto } from './dto/set-reaction.dto';

@Controller('community')
@UseGuards(DevAuthGuard, RolesGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed')
  findFeed() { return this.communityService.findFeed(); }

  @Post('posts')
  createPost(@Body() dto: CreatePostDto, @CurrentUser() user: AuthenticatedUser) {
    return this.communityService.createPost(dto, user);
  }

  @Get('posts/:id/comments')
  findComments(@Param('id') id: string) { return this.communityService.findComments(id); }

  @Post('posts/:id/comments')
  createComment(@Param('id') id: string, @Body() dto: CreateCommentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.communityService.createComment(id, dto, user);
  }

  @Delete('comments/:id')
  deleteComment(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.communityService.deleteComment(id, user);
  }

  @Post('posts/:id/reactions')
  setReaction(@Param('id') id: string, @Body() dto: SetReactionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.communityService.setReaction(id, dto, user);
  }

  @Delete('posts/:id/reactions/:type')
  deleteReaction(@Param('id') id: string, @Param('type') type: ReactionType, @CurrentUser() user: AuthenticatedUser) {
    return this.communityService.deleteReaction(id, type, user);
  }
}
