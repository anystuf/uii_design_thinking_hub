import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChallengeStatus, UserRole } from '@prisma/client';
import { AnnouncementAudience, PublishAnnouncementDto } from './dto/publish-announcement.dto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthenticatedUser) {
    return this.prisma.notification.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /** In-app course or platform announcement. Only a verified course owner or
   * administrator can reach the intended recipients. A new UUID makes every
   * explicit publish action unique; createMany keeps fanout atomic. */
  async publishAnnouncement(dto: PublishAnnouncementDto, user: AuthenticatedUser) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.LECTURER) {
      throw new ForbiddenException('Only lecturers and administrators can announce.');
    }
    const title = dto.title.trim();
    const body = dto.body.trim();
    if (title.length < 4 || body.length < 10) {
      throw new BadRequestException('Please provide a meaningful title and message.');
    }
    if (dto.audience === AnnouncementAudience.ALL_STUDENTS && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators may notify the whole platform.');
    }
    if (dto.audience === AnnouncementAudience.COURSE && !dto.courseId) {
      throw new BadRequestException('A course must be selected.');
    }
    if (dto.audience === AnnouncementAudience.ALL_STUDENTS && dto.courseId) {
      throw new BadRequestException('Site-wide announcements cannot target a course.');
    }

    let recipients: { id: string }[] = [];
    let entityId: string;
    if (dto.audience === AnnouncementAudience.COURSE) {
      const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
      if (!course) throw new NotFoundException('Course not found.');
      if (user.role !== UserRole.ADMIN && course.createdById !== user.id) {
        throw new ForbiddenException('Only the course lecturer may send this announcement.');
      }
      recipients = (await this.prisma.enrollment.findMany({
        where: { courseId: course.id },
        select: { userId: true },
      })).map(record => ({ id: record.userId }));
      entityId = course.id;
    } else {
      recipients = await this.prisma.user.findMany({
        where: { role: UserRole.STUDENT },
        select: { id: true },
      });
      entityId = randomUUID();
    }
    const unique = [...new Set(recipients.map(recipient => recipient.id))];
    if (!unique.length) return { sent: 0, audience: dto.audience, message: 'No recipients yet.' };
    const message = title + '\n\n' + body;
    const publicationId = randomUUID();
    const sent = await this.prisma.notification.createMany({
      data: unique.map(recipientId => ({
        recipientId,
        actorId: user.id,
        type: 'COURSE_ANNOUNCEMENT',
        entityType: dto.audience === AnnouncementAudience.COURSE ? 'Course' : 'Platform',
        entityId,
        message,
        dedupeKey: 'announcement:' + publicationId + ':' + recipientId,
      })),
    });
    return { sent: sent.count, audience: dto.audience };
  }

  async markRead(id: string, user: AuthenticatedUser) {
    const result = await this.prisma.notification.updateMany({
      where: { id, recipientId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: result.count === 1 };
  }

  /**
   * Run hourly in a long-running NestJS deployment.
   * Deduplication is enforced by Notification.dedupeKey UNIQUE.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async reminderTick() {
    try {
      const result = await this.sendDeadlineReminders(new Date());
      this.logger.log('Deadline reminders checked; created ' + result.created);
    } catch (error) {
      this.logger.error('Deadline reminders failed', error instanceof Error ? error.stack : String(error));
    }
  }

  async sendDeadlineReminders(now: Date) {
    const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const milestones = await this.prisma.challengeMilestone.findMany({
      where: {
        dueAt: { gt: now, lte: horizon },
        challenge: { status: ChallengeStatus.PUBLISHED },
      },
      include: {
        challenge: {
          select: {
            title: true,
            projects: {
              select: {
                ownerId: true,
                members: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    const entries: {
      recipientId: string; type: string; entityType: string; entityId: string;
      message: string; dedupeKey: string;
    }[] = [];

    for (const milestone of milestones) {
      if (!milestone.dueAt) continue;
      const recipients = new Set<string>();
      for (const project of milestone.challenge.projects) {
        recipients.add(project.ownerId);
        project.members.forEach((member) => recipients.add(member.userId));
      }
      for (const recipientId of recipients) {
        entries.push({
          recipientId,
          type: 'DEADLINE_REMINDER',
          entityType: 'ChallengeMilestone',
          entityId: milestone.id,
          message: 'Hạn nộp "' + milestone.title + '" sắp đến (' +
            milestone.dueAt.toISOString() + ').',
          dedupeKey: 'deadline:' + milestone.id + ':' +
            milestone.dueAt.toISOString() + ':' + recipientId + ':24h',
        });
      }
    }
    if (!entries.length) return { created: 0 };
    const result = await this.prisma.notification.createMany({
      data: entries, skipDuplicates: true,
    });
    return { created: result.count };
  }
}
