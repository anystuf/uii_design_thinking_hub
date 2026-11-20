import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ExerciseKind, UserRole } from '@prisma/client';
import { PracticeService, gradeQuiz, normalizeQuizItems, publicQuizItems } from '../src/modules/practice/practice.service';
import type { PrismaService } from '../src/database/prisma/prisma.service';
import type { StudioAccessService } from '../src/modules/studio-access/studio-access.service';

const raw = [{
  prompt: 'What is the strongest open-ended interview question?',
  options: ['Is this good?', 'Tell me about a recent difficulty', 'Do you want this?', 'Yes or no?'],
  correctIndex: 1, explanation: 'Ask about actual experiences, not leading opinions.', points: 3,
}];

test('quiz validates and grades correctly without leaking answers before submission', () => {
  const items = normalizeQuizItems(raw);
  assert.equal(items[0].correctIndex, 1);
  assert.deepEqual(publicQuizItems(items), [{
    id: '1', prompt: raw[0].prompt, options: raw[0].options, points: 3,
  }]);
  assert.equal(gradeQuiz(items, [1]).score, 100);
  assert.equal(gradeQuiz(items, [0]).score, 0);
  assert.match(gradeQuiz(items, [0]).feedback, /recent difficulty/);
  assert.throws(() => gradeQuiz(items, [99]), BadRequestException);
  assert.throws(() => gradeQuiz(items, []), BadRequestException);
  assert.throws(() => normalizeQuizItems([{...raw[0], correctIndex: -1}]), BadRequestException);
});

test('student sees only published exercise after enrollment, without correct choices', async () => {
  const items = normalizeQuizItems(raw);
  const course = { id: 'course', status: 'PUBLISHED', createdById: 'owner' };
  const lesson = { id: 'lesson', courseId:'course', publishedAt:new Date(), course };
  const found = { id: 'exercise', lessonId: 'lesson', kind: ExerciseKind.QUIZ, items, publishedAt: new Date() };
  const db = {
    lesson: { findUnique: async () => lesson },
    lessonExercise: { findUnique: async () => found },
    enrollment: { findUnique: async () => ({ id: 'enrolled' }) },
  };
  const service = new PracticeService(db as unknown as PrismaService, {} as StudioAccessService);
  const learner = { id: 'learner', email:'student@example.test', fullName:'Student', role: UserRole.STUDENT };
  const result = await service.getForLesson('lesson', learner);
  assert.equal(result?.id, 'exercise');
  assert.equal('correctIndex' in ((result as {items: unknown[]}).items[0] as object), false);
  assert.equal('explanation' in ((result as {items: unknown[]}).items[0] as object), false);
  const author = await service.getForLesson('lesson', { ...learner, id:'owner', role:UserRole.LECTURER });
  assert.equal((author!.items as unknown as { correctIndex:number }[])[0].correctIndex, 1);
});

test('non-owner teacher cannot author an exercise and published attempts lock edits', async () => {
  const items = normalizeQuizItems(raw);
  const course = { id: 'course', status: 'PUBLISHED', createdById: 'owner' };
  const lesson = { id:'lesson', courseId:'course', publishedAt: new Date(), course };
  const db = {
    lesson: { findUnique: async () => lesson },
    lessonExercise: { findUnique: async () => ({ id: 'exercise', items }) },
    exerciseAttempt: { count: async () => 1 },
  };
  const service = new PracticeService(db as unknown as PrismaService, {} as StudioAccessService);
  const dto = {kind:'QUIZ' as const,title:'Interview quiz',instructions:'Practice',items:raw,passingScore:70,maxAttempts:3,published:true};
  const other = {id:'other',email:'other@example.test',fullName:'Other',role:UserRole.LECTURER};
  await assert.rejects(() => service.save('lesson',dto,other),ForbiddenException);
  await assert.rejects(() => service.save('lesson',dto,{...other,id:'owner'}),ConflictException);
});
