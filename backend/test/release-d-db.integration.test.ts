import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  PrismaClient, ChallengeStatus, CourseStatus, EvidenceType, ReviewDecision,
  RubricStatus, SprintStageType, UserRole,
} from '@prisma/client';
import { AssessmentsService } from '../src/modules/assessments/assessments.service';
import { SnapshotSubmissionsService } from '../src/modules/snapshot-submissions/snapshot-submissions.service';

test('Release D: review is bound to a submission and preserved published rubric', async () => {
  if (process.env.RUN_DB_INTEGRATION !== 'true') return;
  const prisma = new PrismaClient();
  try {
    const studentId = '22222222-2222-4222-8222-222222222222';
    const lecturerId = '11111111-1111-4111-8111-111111111111';
    const courseId = '33333333-3333-4333-8333-333333333333';
    const user = await prisma.user.findUniqueOrThrow({ where: { id: studentId } });
    const lecturer = await prisma.user.findUniqueOrThrow({ where: { id: lecturerId } });
    const challenge = await prisma.designChallenge.create({
      data: {
        courseId, title: 'Review integration test', brief: 'Test feedback',
        status: ChallengeStatus.PUBLISHED,
      },
    });
    const project = await prisma.project.create({
      data: {
        courseId, challengeId: challenge.id, ownerId: studentId,
        title: 'Assessment Test', stages: { create: [
          { stage: SprintStageType.EMPATHIZE },
        ] },
      },
    });
    const stage = await prisma.sprintStage.findUniqueOrThrow({
      where: { projectId_stage: { projectId: project.id, stage: SprintStageType.EMPATHIZE } },
    });
    const evidence = await prisma.evidence.create({
      data: {
        projectId: project.id, sprintStageId: stage.id, createdById: studentId,
        title: 'Interview findings', type: EvidenceType.INTERVIEW,
        versions: { create: {
          version: 1, title: 'Interview findings', type: EvidenceType.INTERVIEW,
          createdById: studentId,
        } },
      },
      include: { versions: true },
    });
    const rubric = await prisma.rubric.create({
      data: {
        challengeId: challenge.id, title: 'DT rubric', createdById: lecturerId,
        versions: { create: {
          version: 1, status: RubricStatus.PUBLISHED, publishedAt: new Date(),
          criteria: { create: [
            { title: 'Empathy', weight: 60, maxScore: 4, orderIndex: 0 },
            { title: 'Testing', weight: 40, maxScore: 4, orderIndex: 1 },
          ] },
        } },
      },
      include: { versions: { include: { criteria: true } } },
    });
    const access = {
      project: async () => project,
      lecturerCourse: async () => ({ id: courseId }),
    };
    const submit = new SnapshotSubmissionsService(prisma as never, access as never);
    const snapshot = await submit.submit(project.id, {
      evidenceVersionIds: [evidence.versions[0].id],
    }, { id: user.id, email: user.email, fullName: user.fullName, role: UserRole.STUDENT });
    const review = new AssessmentsService(prisma as never, access as never);
    const result = await review.publish(snapshot.id, {
      rubricVersionId: rubric.versions[0].id,
      decision: ReviewDecision.APPROVED,
      feedback: 'Great research',
      scores: rubric.versions[0].criteria.map((criterion) => ({
        criterionId: criterion.id,
        score: criterion.title === 'Empathy' ? 3 : 4,
      })),
    }, { id: lecturer.id, email: lecturer.email, fullName: lecturer.fullName, role: UserRole.LECTURER });
    assert.equal(result.totalScore, 85);
    const old = await prisma.rubricVersion.findUniqueOrThrow({
      where: { id: rubric.versions[0].id },
      include: { criteria: true },
    });
    assert.equal(old.status, RubricStatus.PUBLISHED);
    assert.equal(old.criteria.length, 2);
    const approved = await prisma.submissionSnapshot.findUniqueOrThrow({
      where: { id: snapshot.id }, include: { assessments: true },
    });
    assert.equal(approved.status, 'APPROVED');
    assert.equal(approved.assessments.length, 1);
    const notifications = await prisma.notification.findMany({
      where: { entityId: snapshot.id, recipientId: studentId },
    });
    assert.equal(notifications.length, 1);
  } finally {
    await prisma.$disconnect();
  }
});
