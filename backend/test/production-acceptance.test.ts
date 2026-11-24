import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CoursesService } from '../src/modules/courses/courses.service';
import { TeamsService } from '../src/modules/teams/teams.service';
const user = {
  id: 'student-a',
  email: 'a@example.test',
  fullName: 'A',
  role: UserRole.STUDENT,
};
test('bulk learning summaries scope both reads to the student and published enrolled lessons; first gap wins', async () => {
  let reads = 0;
  const service = new CoursesService({
    enrollment: {
      findMany: async (args: any) => {
        reads++;
        assert.equal(args.where.userId, user.id);
        assert.equal(args.where.course.status, 'PUBLISHED');
        return ['complete', 'active', 'empty'].map((courseId) => ({
          courseId,
          course: { id: courseId },
        }));
      },
    },
    lesson: {
      findMany: async (args: any) => {
        reads++;
        assert.deepEqual(args.where.courseId.in, [
          'complete',
          'active',
          'empty',
        ]);
        assert.deepEqual(args.where.publishedAt, { not: null });
        assert.deepEqual(args.orderBy, [{ orderIndex: 'asc' }, { id: 'asc' }]);
        return [
          { id: 'done', courseId: 'complete', title: 'Done' },
          { id: 'gap', courseId: 'active', title: 'First gap' },
          { id: 'later-done', courseId: 'active', title: 'Later' },
        ];
      },
    },
    lessonProgress: {
      findMany: async (args: any) => {
        reads++;
        assert.equal(args.where.userId, user.id);
        assert.deepEqual(args.where.lessonId.in, ['done', 'gap', 'later-done']);
        return [
          { lessonId: 'done', completed: true },
          { lessonId: 'gap', completed: false },
          { lessonId: 'later-done', completed: true },
        ];
      },
    },
  } as never);
  const result = await service.myEnrollments(user);
  assert.equal(reads, 3);
  assert.deepEqual(
    result.map((item) => item.progress),
    [
      { totalLessons: 1, completedLessons: 1, percent: 100, nextLesson: null },
      {
        totalLessons: 2,
        completedLessons: 1,
        percent: 50,
        nextLesson: { id: 'gap', title: 'First gap' },
      },
      { totalLessons: 0, completedLessons: 0, percent: 0, nextLesson: null },
    ],
  );
});
test('no enrollment means no lesson or progress reads, staff cannot query student summaries', async () => {
  const service = new CoursesService({
    enrollment: { findMany: async () => [] },
  } as never);
  assert.deepEqual(await service.myEnrollments(user), []);
  await assert.rejects(
    () => service.myEnrollments({ ...user, role: UserRole.LECTURER }),
    ForbiddenException,
  );
});
test('milestone aggregation uses one membership-scoped query and rejects non-students', async () => {
  let reads = 0;
  const service = new TeamsService(
    {
      challengeMilestone: {
        findMany: async (args: any) => {
          reads++;
          assert.deepEqual(args.where.challenge.projects.some.OR, [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
          ]);
          assert.deepEqual(args.select, { id: true, title: true, dueAt: true });
          return [];
        },
      },
    } as never,
    {} as never,
  );
  assert.deepEqual(await service.myMilestones(user), []);
  assert.equal(reads, 1);
  await assert.rejects(
    () => service.myMilestones({ ...user, role: UserRole.ADMIN }),
    ForbiddenException,
  );
});
