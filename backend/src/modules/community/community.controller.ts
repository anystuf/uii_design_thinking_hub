import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ReactionType } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CommunityService } from './community.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { SetReactionDto } from './dto/set-reaction.dto';

@Controller('community')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed')
  findFeed() { return this.communityService.findFeed(); }

  @Get('questions')
  findQuestions() { return this.communityService.findQuestions(); }

  @Post('questions')
  createQuestion(@Body() dto: CreateQuestionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.communityService.createQuestion(dto, user);
  }

  @Get('questions/:id/answers')
  findAnswers(@Param('id') id: string) {
    return this.communityService.findQuestionAnswers(id);
  }

  @Post('questions/:id/answers')
  createAnswer(@Param('id') id: string, @Body() dto: CreateAnswerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.communityService.createQuestionAnswer(id, dto, user);
  }

  @Patch('questions/:id/answers/:answerId/accept')
  acceptAnswer(
    @Param('id') id: string, @Param('answerId') answerId: string, @CurrentUser() user: AuthenticatedUser
  ) {
    return this.communityService.acceptQuestionAnswer(id, answerId, user);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.communityService.deleteQuestion(id, user);
  }

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
