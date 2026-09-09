import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PostVisibility, ProjectStatus, UserRole } from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { SetReactionDto } from './dto/set-reaction.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  findFeed() {
    return this.prisma.post.findMany({
      where: { visibility: PostVisibility.COMMUNITY },
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

