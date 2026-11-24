import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { CourseStatus, UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { CoursesService } from '../src/modules/courses/courses.service';
import { LessonsService } from '../src/modules/learning-studio/lessons.service';

const student = { id: 'student-1', email: 'student@example.edu', fullName: 'Student', role: UserRole.STUDENT };
const lecturer = { id: 'lecturer-1', email: 'lecturer@example.edu', fullName: 'Lecturer', role: UserRole.LECTURER };

function denied(error: unknown): boolean {
  return error instanceof ForbiddenException;
}

test('F01: spoofed role headers without bearer token do not authenticate', async () => {
  const guard = new JwtAuthGuard(
    { get: () => 'https://demo.supabase.co/auth/v1' } as never,
    {} as never,
  );
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ headers: {
        'x-user-id': lecturer.id,
        'x-user-role': 'ADMIN',
        'x-user-email': lecturer.email,
      } }),
    }),
  };
  await assert.rejects(() => guard.canActivate(context as never),
    (error: unknown) => error instanceof UnauthorizedException);
});

test('F02: student cannot create courses even with valid server-side role', async () => {
  const service = new CoursesService({} as never);
  await assert.rejects(
    () => service.create({ title: 'Unauthorized', level: 'Foundation' }, student),
    denied,
  );
});

test('F02: lecturer cannot inspect another lecturer draft course', async () => {
  const service = new CoursesService({
    course: { findUnique: async () => ({
      id: 'course-private', createdById: 'lecturer-2', status: CourseStatus.DRAFT,
    }) },
  } as never);
  await assert.rejects(
    () => service.findById('course-private', lecturer),
    denied,
  );
});

test('F03/F04: student cannot read lessons without enrollment', async () => {
  let lessonQueryCalled = false;
  const course = { id: 'course-1', createdById: lecturer.id, status: CourseStatus.PUBLISHED };
  const service = new LessonsService({
    course: { findUnique: async () => course },
    enrollment: { findUnique: async () => null },
    lesson: { findMany: async () => { lessonQueryCalled = true; return []; } },
  } as never);
  await assert.rejects(
    () => service.findByCourse(course.id, student),
    denied,
  );
  assert.equal(lessonQueryCalled, false);
});

test('F04: unauthorized progress write is rejected before upsert', async () => {
  let mutationCount = 0;
  const service = new LessonsService({
    lesson: { findUnique: async () => ({
      id: 'lesson-1', courseId: 'course-1', publishedAt: new Date(),
      course: { id: 'course-1', createdById: lecturer.id, status: CourseStatus.PUBLISHED },
    }) },
    enrollment: { findUnique: async () => null },
    lessonProgress: { upsert: async () => { mutationCount++; return {}; } },
  } as never);
  await assert.rejects(
    () => service.updateProgress('lesson-1', { completed: true }, student),
    denied,
  );
  assert.equal(mutationCount, 0);
});

test('F04: progress percentage only counts published lesson IDs returned by database', async () => {
  const service = new CoursesService({
    enrollment: { findUnique: async () => ({ userId: student.id, courseId: 'course-1' }) },
    lesson: { findMany: async () => [{ id: 'lesson-a' }, { id: 'lesson-b' }] },
    lessonProgress: { findMany: async () => [{ lessonId: 'lesson-a', completed: true }] },
  } as never);
  const result = await service.myProgress('course-1', student);
  assert.deepEqual(result, {
    courseId: 'course-1',
    totalLessons: 2,
    completedLessons: 1,
    percent: 50,
    lessons: [{ lessonId: 'lesson-a', completed: true }],
  });
});
