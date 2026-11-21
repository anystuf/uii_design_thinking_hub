import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { calculateLearningRewards } from '../src/modules/courses/learning-rewards';
import { CoursesService } from '../src/modules/courses/courses.service';
import type { PrismaService } from '../src/database/prisma/prisma.service';

test('XP counts verified published lesson completions and each passed exercise once', () => {
  const result = calculateLearningRewards(
    ['a', 'b'], ['a', 'a', 'unpublished'],
    [{ id: 'q1', passingScore: 70 }, { id: 'q2', passingScore: 80 }],
    [
      { exerciseId: 'q1', score: 95 },
      { exerciseId: 'q1', score: 100 },
      { exerciseId: 'q2', score: 70 },
      { exerciseId: 'not-published', score: 100 },
    ],
  );
  assert.deepEqual([result.xp, result.possibleXp, result.completedLessons, result.passedExercises], [60, 120, 1, 1]);
});

test('no penalties or daily-streak requirements; empty course has zero points', () => {
  const result = calculateLearningRewards([], [], [], []);
  assert.equal(result.xp, 0);
  assert.equal(result.possibleXp, 0);
  assert.match(result.pointsPolicy, /no daily streak/);
});

test('GET rewards denies students without this specific course enrollment', async () => {
  const service = new CoursesService({
    enrollment: { findUnique: async () => null },
  } as unknown as PrismaService);
  await assert.rejects(
    service.myRewards('course', { id:'student', email:'student@example.test', fullName:'Student', role:UserRole.STUDENT }),
    ForbiddenException,
  );
});

test('GET rewards does not expose other users or unreleased lessons', async () => {
  const calls: unknown[] = [];
  const prisma = {
    enrollment: { findUnique: async (args: unknown) => { calls.push(args); return { id: 'enrolled' }; } },
    lesson: { findMany: async (args: unknown) => { calls.push(args); return [{id:'a'}, {id:'b'}]; } },
    lessonExercise: { findMany: async (args: unknown) => { calls.push(args); return [{id:'q1',passingScore:70}]; } },
    lessonProgress: { findMany: async (args: unknown) => { calls.push(args); return [{lessonId:'a'}]; } },
    exerciseAttempt: { findMany: async (args: unknown) => { calls.push(args); return [{exerciseId:'q1',score:95}]; } },
  };
  const service = new CoursesService(prisma as unknown as PrismaService);
  const result = await service.myRewards('course', {
    id: 'user-1', email:'test@example.test', fullName:'Student', role:UserRole.STUDENT,
  });
  assert.equal(result.xp, 60);
  assert.equal(result.possibleXp, 80);
  assert.equal(result.completedLessons, 1);
  assert.equal(result.passedExercises, 1);
  const log = JSON.stringify(calls);
  assert.match(log, /user-1/);
  assert.match(log, /course/);
  assert.match(log, /publishedAt/);
  assert.doesNotMatch(log, /user-2/);
});
