import { CourseStatus, LessonContentType, PostVisibility, PrismaClient, ProjectMemberRole, ProjectStatus, SprintPhase, SprintStageType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const lecturerId = '11111111-1111-4111-8111-111111111111';
const studentId = '22222222-2222-4222-8222-222222222222';
const courseId = '33333333-3333-4333-8333-333333333333';
const projectId = '44444444-4444-4444-8444-444444444444';

async function main() {
  await prisma.user.upsert({ where: { id: lecturerId }, update: {}, create: { id: lecturerId, email: 'lecturer@uii.edu.vn', fullName: 'Linh Tran', role: UserRole.LECTURER } });
  await prisma.user.upsert({ where: { id: studentId }, update: {}, create: { id: studentId, email: 'student@uii.edu.vn', fullName: 'Minh Anh', role: UserRole.STUDENT } });

  await prisma.course.upsert({
    where: { id: courseId },
    update: {},
    create: { id: courseId, title: 'Design Thinking Foundations', slug: 'design-thinking-foundations', description: 'Core Design Thinking studio course.', status: CourseStatus.PUBLISHED, level: 'Foundation', sprintPhase: SprintPhase.FULL_SPRINT, createdById: lecturerId },
  });

  const lessonData = [
    ['55555555-5555-4555-8555-555555555551', 'Design research ethics', 1, 12],
    ['55555555-5555-4555-8555-555555555552', 'Interview to discover needs', 2, 18],
    ['55555555-5555-4555-8555-555555555553', 'Synthesize insights from evidence', 3, 24],
    ['55555555-5555-4555-8555-555555555554', 'Write a How Might We question', 4, 16],
  ] as const;
  for (const [id, title, orderIndex, durationMinutes] of lessonData) {
    await prisma.lesson.upsert({ where: { id }, update: {}, create: { id, courseId, title, orderIndex, durationMinutes, contentType: LessonContentType.VIDEO, publishedAt: new Date() } });
  }

  await prisma.enrollment.upsert({ where: { userId_courseId: { userId: studentId, courseId } }, update: {}, create: { userId: studentId, courseId } });
  await prisma.project.upsert({ where: { id: projectId }, update: {}, create: { id: projectId, title: 'Campus Mobility Challenge', description: 'Improve the daily campus mobility experience.', ownerId: studentId, courseId, status: ProjectStatus.APPROVED, currentStage: SprintStageType.DEFINE } });
  await prisma.projectMember.upsert({ where: { projectId_userId: { projectId, userId: studentId } }, update: {}, create: { projectId, userId: studentId, role: ProjectMemberRole.OWNER } });
  for (const stage of Object.values(SprintStageType)) {
    await prisma.sprintStage.upsert({ where: { projectId_stage: { projectId, stage } }, update: {}, create: { projectId, stage, completed: stage === SprintStageType.EMPATHIZE } });
  }
  await prisma.post.upsert({ where: { projectId }, update: {}, create: { projectId, authorId: studentId, caption: 'From interview evidence to a testable mobility concept.', visibility: PostVisibility.COMMUNITY } });
}

main().finally(() => prisma.$disconnect());

