import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PostVisibility, ProjectStatus, UserRole } from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { SetReactionDto } from './dto/set-reaction.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  findFeed() {
    return this.prisma.post.findMany({
      where: { visibility: PostVisibility.COMMUNITY, projectId: { not: null } },
      include: {
        author: { select: { id: true, fullName: true, role: true } },
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            currentStage: true,
            course: { select: { id: true, title: true, slug: true } },
          },
        },
        comments: {
          where: { deletedAt: null, parentId: null },
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, fullName: true, role: true } } },
        },
        reactions: { select: { type: true, userId: true } },
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  // Public-to-members Q&A is separate from approved project showcases.
  // A question cannot expose private project data because it has no projectId.
  findQuestions() {
    return this.prisma.post.findMany({
      where: { visibility: PostVisibility.COMMUNITY, projectId: null, title: { not: null } },
      select: {
        id: true, title: true, topic: true, caption: true,
        publishedAt: true, acceptedCommentId: true,
        author: { select: { id: true, fullName: true, role: true } },
        reactions: { select: { userId: true, type: true } },
        _count: { select: { comments: { where: { deletedAt: null, parentId: null } }, reactions: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 60,
    });
  }

  async createQuestion(dto: CreateQuestionDto, user: AuthenticatedUser) {
    const title = dto.title.trim();
    const body = dto.body.trim();
    if (title.length < 12 || body.length < 20) throw new BadRequestException('Question title or body is too short.');
    const recent = await this.prisma.post.count({
      where: { authorId: user.id, projectId: null, publishedAt: { gte: new Date(Date.now() - 10 * 60_000) } },
    });
    if (recent >= 3) throw new HttpException('Please wait before posting more questions.', HttpStatus.TOO_MANY_REQUESTS);
    await this.ensureUser(user);
    return this.prisma.post.create({
      data: { title, caption: body, topic: dto.topic, authorId: user.id, visibility: PostVisibility.COMMUNITY },
      select: { id: true, title: true, topic: true, publishedAt: true },
    });
  }

  async findQuestionAnswers(questionId: string) {
    await this.assertQuestion(questionId);
    return this.prisma.comment.findMany({
      where: { postId: questionId, deletedAt: null, parentId: null },
      include: {
        author: { select: { id: true, fullName: true, role: true } },
        replies: {
          where: { deletedAt: null },
          include: { author: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async createQuestionAnswer(questionId: string, dto: CreateAnswerDto, user: AuthenticatedUser) {
    await this.assertQuestion(questionId);
    const content = dto.content.trim();
    if (content.length < 5) throw new BadRequestException('Answer is too short.');
    const count = await this.prisma.comment.count({
      where: { authorId: user.id, createdAt: { gte: new Date(Date.now() - 60_000) } },
    });
    if (count >= 5) throw new HttpException('Please slow down before answering again.', HttpStatus.TOO_MANY_REQUESTS);
    await this.ensureUser(user);
    return this.prisma.comment.create({
      data: { postId: questionId, authorId: user.id, content },
      include: { author: { select: { id: true, fullName: true, role: true } } },
    });
  }

  async acceptQuestionAnswer(questionId: string, answerId: string, user: AuthenticatedUser) {
    const question = await this.assertQuestion(questionId);
    if (user.role !== UserRole.ADMIN && question.authorId !== user.id)
      throw new ForbiddenException('Only the question author or an administrator can accept an answer.');
    const answer = await this.prisma.comment.findUnique({ where: { id: answerId } });
    if (!answer || answer.postId !== questionId || answer.parentId !== null || answer.deletedAt)
      throw new NotFoundException('Answer not found for this question.');
    const acceptedCommentId = question.acceptedCommentId === answerId ? null : answerId;
    await this.prisma.post.update({ where: { id: questionId }, data: { acceptedCommentId } });
    return { acceptedCommentId };
  }

  async deleteQuestion(questionId: string, user: AuthenticatedUser) {
    const question = await this.assertQuestion(questionId);
    if (user.role !== UserRole.ADMIN && question.authorId !== user.id)
      throw new ForbiddenException('Only the question author or an administrator can delete a question.');
    await this.prisma.post.delete({ where: { id: questionId } });
    return { success: true };
  }

  private async assertQuestion(id: string) {
    const question = await this.assertPost(id);
    if (question.projectId !== null || !question.title)
      throw new NotFoundException('Community question not found.');
    return question;
  }

  async createPost(dto: CreatePostDto, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found.');
    if (user.role !== UserRole.ADMIN && project.ownerId !== user.id) {
      throw new ForbiddenException('You can only publish your own project.');
    }
    if (project.status !== ProjectStatus.APPROVED && project.status !== ProjectStatus.PUBLISHED) {
      throw new ForbiddenException('Only approved projects can be published.');
    }
    await this.ensureUser(user);
    return this.prisma.$transaction(async (tx) => {
      if (project.status === ProjectStatus.APPROVED) {
        await tx.project.update({ where: { id: project.id }, data: { status: ProjectStatus.PUBLISHED } });
      }
      return tx.post.upsert({
        where: { projectId: project.id },
        create: { projectId: project.id, authorId: user.id, caption: dto.caption, visibility: dto.visibility ?? PostVisibility.COMMUNITY },
        update: { caption: dto.caption, visibility: dto.visibility ?? PostVisibility.COMMUNITY },
      });
    });
  }

  async findComments(postId: string) {
    await this.assertPost(postId);
    return this.prisma.comment.findMany({
      where: { postId, deletedAt: null, parentId: null },
      include: {
        author: { select: { id: true, fullName: true, role: true } },
        replies: {
          where: { deletedAt: null },
          include: { author: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createComment(postId: string, dto: CreateCommentDto, user: AuthenticatedUser) {
    await this.assertPost(postId);
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.postId !== postId) throw new NotFoundException('Parent comment not found.');
    }
    await this.ensureUser(user);
    return this.prisma.comment.create({
      data: { postId, authorId: user.id, parentId: dto.parentId, content: dto.content.trim() },
      include: { author: { select: { id: true, fullName: true, role: true } } },
    });
  }

  async deleteComment(id: string, user: AuthenticatedUser) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found.');
    if (user.role !== UserRole.ADMIN && comment.authorId !== user.id) {
      throw new ForbiddenException('You can only delete your own comment.');
    }
    await this.prisma.comment.update({ where: { id }, data: { deletedAt: new Date(), content: '[deleted]' } });
    await this.prisma.post.updateMany({ where: { id: comment.postId, acceptedCommentId: id }, data: { acceptedCommentId: null } });
    return { success: true };
  }

  async setReaction(postId: string, dto: SetReactionDto, user: AuthenticatedUser) {
    await this.assertPost(postId);
    await this.ensureUser(user);
    return this.prisma.reaction.upsert({
      where: { postId_userId_type: { postId, userId: user.id, type: dto.type } },
      create: { postId, userId: user.id, type: dto.type },
      update: {},
    });
  }

  async deleteReaction(postId: string, type: SetReactionDto['type'], user: AuthenticatedUser) {
    await this.prisma.reaction.deleteMany({ where: { postId, userId: user.id, type } });
    return { success: true };
  }

  private async assertPost(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.visibility !== PostVisibility.COMMUNITY) throw new NotFoundException('Post not found.');
    return post;
  }

  private async ensureUser(user: AuthenticatedUser) {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      update: { email: user.email, fullName: user.fullName, role: user.role },
    });
  }
}

