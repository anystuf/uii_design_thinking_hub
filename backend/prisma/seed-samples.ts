import { PrismaClient, SprintStageType } from '@prisma/client';

/**
 * Opt-in staging fixture. Never run the legacy prisma/seed.ts for Supabase Auth users.
 * Run with SAMPLE_LECTURER_USER_ID and --apply after checking DATABASE_URL points at staging.
 */
const prisma = new PrismaClient();
const stages = [SprintStageType.EMPATHIZE, SprintStageType.DEFINE, SprintStageType.IDEATE, SprintStageType.PROTOTYPE, SprintStageType.TEST];

const templates = [
  { slug: 'sample-interview-notes', name: 'SAMPLE · Interview notes', mode: SprintStageType.EMPATHIZE, description: 'Fictional practice only; never use as research evidence.', instructions: 'Practice separating what a participant said from your interpretation. Do not submit this sample as real research.', fields: [{ key: 'participant', label: 'Practice persona (fictional)', type: 'text' }, { key: 'observation', label: 'What was observed in the scenario?', type: 'textarea' }, { key: 'need', label: 'Possible need to investigate', type: 'textarea' }] },
  { slug: 'sample-pov-hmw', name: 'SAMPLE · Point of view & HMW', mode: SprintStageType.DEFINE, description: 'A classroom example for reframing a problem.', instructions: 'Use a user + need + insight statement, then make a focused How Might We question.', fields: [{ key: 'user', label: 'User', type: 'text' }, { key: 'need', label: 'Need', type: 'textarea' }, { key: 'insight', label: 'Insight', type: 'textarea' }, { key: 'hmw', label: 'How might we…?', type: 'textarea' }] },
  { slug: 'sample-idea-cards', name: 'SAMPLE · Idea cards', mode: SprintStageType.IDEATE, description: 'Practice generating and selecting options.', instructions: 'Generate several different approaches before selecting one. Explain what you would test first.', fields: [{ key: 'ideas', label: 'Ideas', type: 'textarea' }, { key: 'selection', label: 'Idea to prototype', type: 'text' }, { key: 'reason', label: 'Why this one?', type: 'textarea' }] },
  { slug: 'sample-prototype-plan', name: 'SAMPLE · Prototype plan', mode: SprintStageType.PROTOTYPE, description: 'A plan for a small, testable prototype.', instructions: 'Name one assumption, build the smallest representation that can test it, and list the materials.', fields: [{ key: 'assumption', label: 'Assumption to test', type: 'textarea' }, { key: 'format', label: 'Prototype format', type: 'text' }, { key: 'steps', label: 'Build steps', type: 'textarea' }] },
  { slug: 'sample-user-test-report', name: 'SAMPLE · Test reflection', mode: SprintStageType.TEST, description: 'A reflection template; no real user data is included.', instructions: 'Record evidence only after a real test. For this sample, use fictional scenario details and label them clearly.', fields: [{ key: 'hypothesis', label: 'What did we expect?', type: 'textarea' }, { key: 'observation', label: 'What happened? (fictional sample)', type: 'textarea' }, { key: 'learning', label: 'What did we learn?', type: 'textarea' }, { key: 'next', label: 'Next iteration', type: 'textarea' }] },
];

const courses = [
  { slug: 'sample-design-thinking-foundations', title: 'SAMPLE · Design Thinking Foundations', description: 'A short starter course. Example content only; adapt it for your class.', level: 'Foundation', lessons: [
    { title: 'What is Design Thinking?', type: 'VIDEO', minutes: 5, video: 'https://www.youtube.com/watch?v=ldYzbV0NDp8', content: 'IDEO U introduces human-centered creative problem solving.\nSource: IDEO U · https://www.youtube.com/watch?v=ldYzbV0NDp8' },
    { title: 'Explore the Stanford d.school Bootleg', type: 'TEMPLATE', minutes: 20, content: 'Browse the method cards and choose one method to try with your team. Review its instructions before collecting any real research.\nResource: Stanford d.school · https://dschool.stanford.edu/tools/design-thinking-bootleg' },
    { title: 'Practice: reframe a campus challenge', type: 'WORKSHOP', minutes: 30, content: 'Practice scenario (fictional): students have difficulty finding a quiet place between classes. Write what you know, what you are assuming, and one question you would investigate. Do not present this scenario as interview evidence.' },
  ] },
  { slug: 'sample-empathy-and-research', title: 'SAMPLE · Empathy & Research', description: 'Practice planning interviews and synthesizing observations. No participant data is included.', level: 'Foundation', lessons: [
    { title: 'The Design Thinking Process', type: 'VIDEO', minutes: 6, video: 'https://www.youtube.com/watch?v=McTh-xzxfRE', content: 'IDEO U walks through phases of framing and sharing a design process.\nSource: IDEO U · https://www.youtube.com/watch?v=McTh-xzxfRE' },
    { title: 'Interview plan worksheet', type: 'TEMPLATE', minutes: 15, content: 'Write an open-ended interview guide. Ask about concrete past experiences, avoid leading questions, and request consent before collecting or sharing information.' },
    { title: 'From notes to insight', type: 'WORKSHOP', minutes: 25, content: 'Practice scenario (fictional): a commuter arrives early but cannot tell whether a study room is occupied. Separate the observation, interpretation, and question you would validate.' },
  ] },
  { slug: 'sample-prototype-and-test', title: 'SAMPLE · Prototype, Test & Iterate', description: 'A lightweight practice route from a testable question to a prototype and reflection.', level: 'Intermediate', lessons: [
    { title: 'Make an assumption testable', type: 'ARTICLE', minutes: 10, content: 'Choose the riskiest assumption, identify observable behavior, and decide what result would change your next step. Keep the prototype small.' },
    { title: 'Prototype planning canvas', type: 'TEMPLATE', minutes: 15, content: '1. Assumption\n2. User task\n3. Prototype format\n4. What to observe\n5. What you will change after the test.' },
    { title: 'Test and reflect', type: 'ASSIGNMENT', minutes: 20, content: 'Submit your own project evidence only after a test. Record consent, context, observations, limitations, learning, and the next iteration. Never use the fictional examples as participant data.' },
  ] },
];

async function main() {
  if (!process.argv.includes('--apply')) throw new Error('Dry run. Recheck the staging DATABASE_URL and pass --apply to write sample data.');
  const lecturerId = process.env.SAMPLE_LECTURER_USER_ID;
  if (!lecturerId) throw new Error('Set SAMPLE_LECTURER_USER_ID to an existing Supabase-auth-backed LECTURER or ADMIN user.');
  const lecturer = await prisma.user.findUnique({ where: { id: lecturerId } });
  if (!lecturer || !['LECTURER', 'ADMIN'].includes(lecturer.role)) throw new Error('The specified publisher must already exist with LECTURER or ADMIN role. This script will not change roles.');
  const studentId = process.env.SAMPLE_STUDENT_USER_ID;
  const student = studentId ? await prisma.user.findUnique({ where: { id: studentId } }) : null;
  if (studentId && (!student || student.role !== 'STUDENT')) throw new Error('SAMPLE_STUDENT_USER_ID must identify an existing student.');

  const result = await prisma.$transaction(async (tx) => {
    const templateRows = new Map<string, string>();
    for (const item of templates) {
      const saved = await tx.activityTemplate.upsert({ where: { slug: item.slug }, update: { name: item.name, description: item.description, mode: item.mode, instructions: item.instructions, fields: item.fields, isActive: true }, create: item });
      templateRows.set(item.slug, saved.id);
    }

    const courseRows: { id: string; slug: string }[] = [];
    for (const item of courses) {
      const savedCourse = await tx.course.upsert({ where: { slug: item.slug }, update: { title: item.title, description: item.description, level: item.level, status: 'PUBLISHED', createdById: lecturer.id }, create: { slug: item.slug, title: item.title, description: item.description, level: item.level, status: 'PUBLISHED', createdById: lecturer.id, enforceStageOrder: false } });
      for (const [index, lesson] of item.lessons.entries()) {
        const existing = await tx.lesson.findFirst({ where: { courseId: savedCourse.id, title: lesson.title } });
        const fields = { description: 'Sample learning content. Adapt before teaching.', content: lesson.content, contentType: lesson.type as 'VIDEO' | 'ARTICLE' | 'WORKSHOP' | 'TEMPLATE' | 'ASSIGNMENT', videoUrl: 'video' in lesson ? lesson.video : null, durationMinutes: lesson.minutes, orderIndex: index, publishedAt: savedCourse.createdAt };
        if (existing) await tx.lesson.update({ where: { id: existing.id }, data: fields });
        else await tx.lesson.create({ data: { ...fields, title: lesson.title, courseId: savedCourse.id } });
      }
      courseRows.push({ id: savedCourse.id, slug: item.slug });
    }

    const foundation = courseRows[0];
    const challengeTitle = 'SAMPLE · Make campus study spaces easier to find';
    const challenge = await tx.designChallenge.findFirst({ where: { courseId: foundation.id, title: challengeTitle } }) ?? await tx.designChallenge.create({ data: { courseId: foundation.id, title: challengeTitle, brief: 'Fictional practice brief: explore how students might find an appropriate place to study between classes. Validate the problem with your own consent-based research before making claims.', learningOutcomes: 'Plan research; synthesize insights; create and test a low-fidelity prototype; document iteration.', status: 'PUBLISHED', publishedAt: new Date() } });
    const milestones = [
      ['Empathize · research plan', stages[0], 'Prepare a consent-aware interview plan. No interviews are supplied in this sample.'],
      ['Define · point of view', stages[1], 'Synthesize your own evidence into a user, need, insight and How Might We question.'],
      ['Ideate · options', stages[2], 'Generate varied ideas and explain which assumption to test first.'],
      ['Prototype · first version', stages[3], 'Build a low-fidelity prototype and note its limitations.'],
      ['Test · iteration plan', stages[4], 'Document real observations only after a consent-based test, then decide what to change.'],
    ];
    for (const [title, mode, description] of milestones) {
      if (!await tx.challengeMilestone.findFirst({ where: { challengeId: challenge.id, title: title as string } })) await tx.challengeMilestone.create({ data: { challengeId: challenge.id, title: title as string, mode: mode as SprintStageType, description: description as string, deliverables: description as string, allowLate: true } });
    }
    for (const template of templates) {
      const templateId = templateRows.get(template.slug)!;
      if (!await tx.challengeActivity.findFirst({ where: { challengeId: challenge.id, templateId } })) await tx.challengeActivity.create({ data: { challengeId: challenge.id, templateId, instructions: template.instructions, publishedAt: new Date() } });
    }
    let sampleProjects = 0;
    if (student) {
      const sampleTitle = 'SAMPLE · Campus study-space finder';
      let project = await tx.project.findFirst({ where: { title: sampleTitle, ownerId: student.id, courseId: foundation.id } });
      if (!project) {
        project = await tx.project.create({ data: { title: sampleTitle, description: 'Fictional classroom practice project. No real student research or participant data is included.', ownerId: student.id, courseId: foundation.id, challengeId: challenge.id, status: 'DRAFT', currentStage: SprintStageType.EMPATHIZE } });
        sampleProjects = 1;
      }
      await tx.projectMember.upsert({ where: { projectId_userId: { projectId: project.id, userId: student.id } }, update: { challengeId: challenge.id, role: 'OWNER' }, create: { projectId: project.id, userId: student.id, challengeId: challenge.id, role: 'OWNER' } });
      for (const stage of stages) await tx.sprintStage.upsert({ where: { projectId_stage: { projectId: project.id, stage } }, update: {}, create: { projectId: project.id, stage, completed: false } });
      const tasks = [
        ['SAMPLE · Draft a consent-aware research plan', 'Planning only; do not record participant data in the sample fixture.'],
        ['SAMPLE · Write a point of view statement', 'Use evidence collected by your team; this seed contains no interview evidence.'],
        ['SAMPLE · Sketch two low-fidelity concepts', 'Practice activity; keep prototypes clearly labeled as examples.'],
      ];
      for (const [title, description] of tasks) if (!await tx.projectTask.findFirst({ where: { projectId: project.id, title } })) await tx.projectTask.create({ data: { projectId: project.id, title, description, createdById: lecturer.id } });
    }
    return { courses: courseRows.length, lessons: courses.reduce((n, c) => n + c.lessons.length, 0), templates: templates.length, challenges: 1, milestones: milestones.length, sampleProjects };
  }, { timeout: 30000 });
  console.log('Sample catalog created/updated:', result);
  console.log('Student progress, project submissions, feedback, assessments, storage files, and account roles were not changed.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
