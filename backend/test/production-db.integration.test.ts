import 'reflect-metadata';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { PrismaClient, UserRole } from '@prisma/client';
import { CoursesService } from '../src/modules/courses/courses.service';
import { TeamsService } from '../src/modules/teams/teams.service';
test('isolated Postgres: learning summaries and membership-filtered milestone relation execute against migrated schema', async (t) => {
  if (!process.env.DATABASE_URL || process.env.RUN_DB_INTEGRATION !== 'true') {
    t.skip('Requires isolated seeded Postgres');
    return;
  }
  const prisma = new PrismaClient();
  const courseId = '33333333-3333-4333-8333-333333333333';
  const studentId = '22222222-2222-4222-8222-222222222222';
  const rollback = new Error('Rollback isolated acceptance fixture');
  try {
    await prisma.$transaction(async (tx) => {
      const profile = await tx.user.findUniqueOrThrow({
        where: { id: studentId },
      });
      const user = {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        role: UserRole.STUDENT,
      };
      const summaries = await new CoursesService(tx as never).myEnrollments(
        user,
      );
      const seeded = summaries.find((item) => item.courseId === courseId);
      assert.ok(seeded);
      assert.ok(seeded.progress.totalLessons > 0);
      assert.ok(seeded.progress.nextLesson);
      const teacher = await tx.course.findUniqueOrThrow({
        where: { id: courseId },
      });
      const ids: string[] = [];
      for (const ownerId of [studentId, teacher.createdById]) {
        const challenge = await tx.designChallenge.create({
          data: {
            courseId,
            title: 'Isolated acceptance',
            brief: 'Rollback fixture',
          },
        });
        await tx.project.create({
          data: {
            courseId,
            challengeId: challenge.id,
            ownerId,
            title: 'Isolated team',
          },
        });
        const milestone = await tx.challengeMilestone.create({
          data: {
            challengeId: challenge.id,
            title: 'Scoped milestone',
            dueAt: new Date('2027-01-01'),
          },
        });
        ids.push(milestone.id);
      }
      const milestones = await new TeamsService(
        tx as never,
        {} as never,
      ).myMilestones(user);
      assert.ok(milestones.some((item) => item.id === ids[0]));
      assert.equal(
        milestones.some((item) => item.id === ids[1]),
        false,
      );
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await prisma.$disconnect();
  }
});
