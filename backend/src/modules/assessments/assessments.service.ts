import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import {
  Prisma, ReviewDecision, RubricStatus, SubmissionStatus, UserRole,
} from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StudioAccessService } from '../studio-access/studio-access.service';
import { PublishAssessmentDto } from './dto/publish-assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: StudioAccessService,
  ) {}

  async queue(user: AuthenticatedUser) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.LECTURER) {
      throw new ForbiddenException('Only reviewers can access the review queue.');
    }
    return this.prisma.submissionSnapshot.findMany({
      where: {
        status: SubmissionStatus.SUBMITTED,
        ...(user.role === UserRole.ADMIN ? {} : { project: { course: { createdById: user.id } } }),
      },
      include: {
        project: { select: { id: true, title: true, challengeId: true, courseId: true } },
        submittedBy: { select: { id: true, fullName: true } },
        milestone: { select: { id: true, title: true } },
        _count: { select: { items: true } },
      },
      orderBy: { submittedAt: 'asc' },
      take: 100,
    });
  }

  async publish(submissionId: string, dto: PublishAssessmentDto, user: AuthenticatedUser) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.LECTURER) {
      throw new ForbiddenException('Only course reviewers can publish assessments.');
    }
    const submission = await this.prisma.submissionSnapshot.findUnique({
      where: { id: submissionId },
      include: {
        project: {
          include: {
            course: { select: { id: true, createdById: true } },
            members: { select: { userId: true } },
          },
        },
      },
    });
    if (!submission) throw new NotFoundException('Submission not found.');
    await this.access.lecturerCourse(submission.project.course.id, user);
    if (submission.status !== SubmissionStatus.SUBMITTED) {
      throw new ConflictException('This submission is not awaiting review.');
    }
    if (!submission.project.challengeId) {
      throw new BadRequestException('Versioned rubric review requires a Design Challenge.');
    }
    if (
      dto.decision === ReviewDecision.REVISION_REQUESTED &&
      !dto.feedback?.trim()
    ) throw new BadRequestException('Revision request must explain the required changes.');

    const rubricVersion = await this.prisma.rubricVersion.findUnique({
      where: { id: dto.rubricVersionId },
      include: { rubric: true, criteria: true },
    });
    if (!rubricVersion || rubricVersion.status !== RubricStatus.PUBLISHED) {
      throw new BadRequestException('A published rubric version is required.');
    }
    if (rubricVersion.rubric.challengeId !== submission.project.challengeId) {
      throw new BadRequestException('Rubric belongs to a different challenge.');
    }
    if (
      rubricVersion.rubric.milestoneId &&
      rubricVersion.rubric.milestoneId !== submission.milestoneId
    ) throw new BadRequestException('Rubric milestone differs from the submission.');

    const criteria = rubricVersion.criteria;
    if (!criteria.length || criteria.reduce((acc, c) => acc + c.weight, 0) !== 100) {
      throw new ConflictException('Published rubric is incomplete.');
    }
    const scoreMap = new Map(dto.scores.map((row) => [row.criterionId, row]));
    if (
      scoreMap.size !== criteria.length || dto.scores.length !== criteria.length ||
      criteria.some((criterion) => !scoreMap.has(criterion.id))
    ) throw new BadRequestException('Every rubric criterion must be scored exactly once.');

    for (const criterion of criteria) {
      const score = scoreMap.get(criterion.id)!.score;
      if (!Number.isFinite(score) || score < 0 || score > criterion.maxScore) {
        throw new BadRequestException('A criterion score exceeds the configured range.');
      }
    }
    const totalScore = Math.round(criteria.reduce((acc, c) =>
      acc + c.weight * scoreMap.get(c.id)!.score / c.maxScore, 0) * 100) / 100;
    const recipients = [...new Set([
      submission.project.ownerId,
      ...submission.project.members.map((member) => member.userId),
    ])];

    // Atomic review publication: only one reviewer may advance SUBMITTED once.
    // Roll back status, grades and all notices if any write fails.
    try {
      return await this.prisma.$transaction(async (tx) => {
        const status = dto.decision === ReviewDecision.APPROVED
          ? SubmissionStatus.APPROVED : SubmissionStatus.REVISION_REQUESTED;
        const transition = await tx.submissionSnapshot.updateMany({
          where: { id: submissionId, status: SubmissionStatus.SUBMITTED },
          data: { status, reviewedAt: new Date() },
        });
        if (transition.count !== 1) {
          throw new ConflictException('Submission was already reviewed.');
        }

        const assessment = await tx.assessment.create({
          data: {
            submissionId, rubricVersionId: dto.rubricVersionId,
            reviewerId: user.id, decision: dto.decision,
            feedback: dto.feedback, totalScore,
            scores: { create: criteria.map((criterion) => ({
              criterionId: criterion.id, score: scoreMap.get(criterion.id)!.score,
              comment: scoreMap.get(criterion.id)!.comment,
            })) },
          },
          include: { scores: { include: { criterion: true } }, rubricVersion: true },
        });

        if (recipients.length) {
          await tx.notification.createMany({
            data: recipients.map((recipientId) => ({
              recipientId, actorId: user.id, type: 'SUBMISSION_REVIEW',
              entityType: 'SubmissionSnapshot', entityId: submissionId,
              message: dto.decision === ReviewDecision.APPROVED
                ? 'Giảng viên đã phê duyệt bài nộp v' + submission.version
                : 'Bài nộp v' + submission.version + ' cần chỉnh sửa theo phản hồi',
              dedupeKey: 'review:' + submissionId + ':' + recipientId,
            })),
            skipDuplicates: true,
          });
        }
        return assessment;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isTransactionConflict(error)) {
        throw new ConflictException('Review already published. Refresh the submission.');
      }
      throw error;
    }
  }

  async get(submissionId: string, user: AuthenticatedUser) {
    const submission = await this.prisma.submissionSnapshot.findUnique({
      where: { id: submissionId },
      select: { projectId: true },
    });
    if (!submission) throw new NotFoundException('Submission not found.');
    await this.access.project(submission.projectId, user);
    return this.prisma.assessment.findUnique({
      where: { submissionId },
      include: {
        reviewer: { select: { id: true, fullName: true } },
        rubricVersion: { include: { rubric: { select: { id: true, title: true } } } },
        scores: { include: { criterion: true }, orderBy: { criterion: { orderIndex: 'asc' } } },
      },
    });
  }
}

function isTransactionConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2002' || error.code === 'P2034');
}
