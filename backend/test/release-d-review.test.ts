import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  BadRequestException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import {
  ReviewDecision, RubricStatus, SubmissionStatus, UserRole,
} from '@prisma/client';
import { AssessmentsService } from '../src/modules/assessments/assessments.service';
import { RubricsService } from '../src/modules/rubrics/rubrics.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

const student = { id: 'student-a', email: 'a@example.edu', fullName: 'Student', role: UserRole.STUDENT };
const lecturer = { id: 'teacher-a', email: 'teacher@example.edu', fullName: 'Lecturer', role: UserRole.LECTURER };
const submission = {
  id: 'submission-a', version: 1, projectId: 'project-a', milestoneId: null,
  status: SubmissionStatus.SUBMITTED,
  project: {
    id: 'project-a', challengeId: 'challenge-a', ownerId: student.id,
    course: { id: 'course-a', createdById: lecturer.id },
    members: [{ userId: student.id }],
  },
};
const rubricVersion = {
  id: 'rubric-version-a', status: RubricStatus.PUBLISHED,
  rubric: { challengeId: 'challenge-a', milestoneId: null },
  criteria: [
    { id: 'c1', title: 'User empathy', weight: 60, maxScore: 4, orderIndex: 0 },
    { id: 'c2', title: 'Experiments', weight: 40, maxScore: 4, orderIndex: 1 },
  ],
};

test('F13: student is forbidden from reviewer queue', async () => {
  const service = new AssessmentsService({} as never, {} as never);
  await assert.rejects(() => service.queue(student),
    (error: unknown) => error instanceof ForbiddenException);
});

test('F13: a review must belong to the lecturer course', async () => {
  const service = new AssessmentsService({
    submissionSnapshot: { findUnique: async () => submission },
  } as never, { lecturerCourse: async () => {
    throw new ForbiddenException('Not this course lecturer.');
  } } as never);
  await assert.rejects(() => service.publish(submission.id, {
    rubricVersionId: rubricVersion.id, decision: ReviewDecision.APPROVED,
    scores: [{ criterionId: 'c1', score: 4 }, { criterionId: 'c2', score: 3 }],
  }, lecturer), (error: unknown) => error instanceof ForbiddenException);
});

test('F13: a revision request must contain feedback', async () => {
  const service = new AssessmentsService({
    submissionSnapshot: { findUnique: async () => submission },
  } as never, { lecturerCourse: async () => ({ id: 'course-a' }) } as never);
  await assert.rejects(() => service.publish(submission.id, {
    rubricVersionId: rubricVersion.id,
    decision: ReviewDecision.REVISION_REQUESTED, scores: [],
  }, lecturer), (error: unknown) => error instanceof BadRequestException);
});

test('F14: assessment rejects a rubric from another challenge', async () => {
  const service = new AssessmentsService({
    submissionSnapshot: { findUnique: async () => submission },
    rubricVersion: { findUnique: async () => ({
      ...rubricVersion, rubric: { challengeId: 'wrong-challenge', milestoneId: null },
    }) },
  } as never, { lecturerCourse: async () => ({ id: 'course-a' }) } as never);
  await assert.rejects(() => service.publish(submission.id, {
    rubricVersionId: rubricVersion.id, decision: ReviewDecision.APPROVED,
    scores: [{ criterionId: 'c1', score: 4 }, { criterionId: 'c2', score: 3 }],
  }, lecturer), (error: unknown) => error instanceof BadRequestException);
});

test('F14: published rubric criteria cannot be edited in place', async () => {
  const service = new RubricsService({
    rubricVersion: { findUnique: async () => ({
      id: 'v1', status: RubricStatus.PUBLISHED, rubric: { challengeId: 'ch-1' },
    }) },
  } as never, {
    challenge: async () => ({ courseId: 'course-a' }),
    lecturerCourse: async () => ({ id: 'course-a' }),
  } as never);
  await assert.rejects(() => service.replaceCriteria('v1', { criteria: [
    { title: 'Changed', weight: 100, maxScore: 4 },
  ] }, lecturer), (error: unknown) => error instanceof ConflictException);
});

test('F14: published rubric must have weight sum exactly 100', async () => {
  const service = new RubricsService({
    rubricVersion: { findUnique: async () => ({
      id: 'v1', status: RubricStatus.DRAFT, rubric: { challengeId: 'ch-1' },
    }) },
    $transaction: async (callback: (tx: any) => Promise<unknown>) => callback({
      rubricVersion: { updateMany: async () => ({ count: 1 }) },
      rubricCriterion: { findMany: async () => [{ weight: 60 }, { weight: 30 }] },
    }),
  } as never, {
    challenge: async () => ({ courseId: 'course-a' }),
    lecturerCourse: async () => ({ id: 'course-a' }),
  } as never);
  await assert.rejects(() => service.publish('v1', lecturer),
    (error: unknown) => error instanceof BadRequestException);
});

test('F14: review score validation prevents scores above criterion max', async () => {
  const service = new AssessmentsService({
    submissionSnapshot: { findUnique: async () => submission },
    rubricVersion: { findUnique: async () => rubricVersion },
  } as never, { lecturerCourse: async () => ({ id: 'course-a' }) } as never);
  await assert.rejects(() => service.publish(submission.id, {
    rubricVersionId: rubricVersion.id, decision: ReviewDecision.APPROVED,
    scores: [{ criterionId: 'c1', score: 5 }, { criterionId: 'c2', score: 3 }],
  }, lecturer), (error: unknown) => error instanceof BadRequestException);
});

test('F13/F14/F16: accepted review stores weighted score and recipient notification', async () => {
  let transactionData: Record<string, any> = {};
  const service = new AssessmentsService({
    submissionSnapshot: { findUnique: async () => submission },
    rubricVersion: { findUnique: async () => rubricVersion },
    $transaction: async (callback: (tx: any) => Promise<unknown>) => callback({
      submissionSnapshot: { updateMany: async () => ({ count: 1 }) },
      assessment: { create: async (input: any) => {
        transactionData.assessment = input.data;
        return { id: 'assessment-a', ...input.data };
      } },
      notification: { createMany: async (input: any) => {
        transactionData.notifications = input.data;
        return { count: input.data.length };
      } },
    }),
  } as never, { lecturerCourse: async () => ({ id: 'course-a' }) } as never);
  const result = await service.publish(submission.id, {
    rubricVersionId: rubricVersion.id, decision: ReviewDecision.APPROVED,
    scores: [{ criterionId: 'c1', score: 3 }, { criterionId: 'c2', score: 4 }],
  }, lecturer);
  assert.equal(result.totalScore, 85);
  assert.equal(transactionData.assessment.scores.create.length, 2);
  assert.equal(transactionData.notifications.length, 1);
  assert.equal(transactionData.notifications[0].recipientId, student.id);
});

test('F16: notification lists are recipient-scoped', async () => {
  let scope: Record<string, any> = {};
  const service = new NotificationsService({
    notification: { findMany: async (opts: any) => { scope = opts; return []; } },
  } as never);
  await service.list(student);
  assert.equal(scope.where.recipientId, student.id);
});

test('F16: deadline reminder keys are idempotent and skip duplicates', async () => {
  const dueAt = new Date('2030-01-01T12:00:00Z');
  let generated: Record<string, any> = {};
  const service = new NotificationsService({
    challengeMilestone: { findMany: async () => [{
      id: 'milestone-a', title: 'Test prototype', dueAt,
      challenge: { projects: [{ ownerId: student.id, members: [{ userId: student.id }] }] },
    }] },
    notification: { createMany: async (options: any) => {
      generated = options;
      return { count: options.data.length };
    } },
  } as never);
  const result = await service.sendDeadlineReminders(new Date('2029-12-31T17:00:00Z'));
  assert.equal(result.created, 1);
  assert.equal(generated.skipDuplicates, true);
  assert.equal(generated.data[0].recipientId, student.id);
  assert.match(generated.data[0].dedupeKey, /^deadline:/);
});
