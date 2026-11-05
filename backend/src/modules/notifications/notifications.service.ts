import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChallengeStatus } from '@prisma/client';
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
