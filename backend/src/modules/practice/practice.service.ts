import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import {
  CourseStatus, ExerciseAttemptStatus, ExerciseKind,
  Prisma, UserRole,
} from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StudioAccessService } from '../studio-access/studio-access.service';
import { ReviewAttemptDto, SaveExerciseDto, SubmitAttemptDto } from './dto/practice.dto';

export type QuizItem = {
  id: string; prompt: string; options: string[];
  correctIndex: number; explanation: string; points: number;
};

export function normalizeQuizItems(items: unknown[]): QuizItem[] {
  if (!Array.isArray(items) || items.length < 1 || items.length > 20)
    throw new BadRequestException('A quiz needs 1–20 questions.');
  return items.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      throw new BadRequestException('Invalid question.');
    const item = raw as Record<string, unknown>;
    const prompt = typeof item.prompt === 'string' ? item.prompt.trim() : '';
    const options = item.options;
    const correctIndex = item.correctIndex;
    const points = item.points ?? 1;
    const explanation = item.explanation ?? '';
    if (prompt.length < 4 || prompt.length > 1000 ||
      !Array.isArray(options) || options.length < 2 || options.length > 6 ||
      options.some(v => typeof v !== 'string' || !v.trim() || v.length > 300) ||
      !Number.isInteger(correctIndex) || (correctIndex as number) < 0 ||
      (correctIndex as number) >= options.length ||
      !Number.isInteger(points) || (points as number) < 1 || (points as number) > 20 ||
      typeof explanation !== 'string' || explanation.length > 1000) {
      throw new BadRequestException('Invalid question content, options, answer or points.');
    }
    return {
      id: String(index + 1), prompt,
      options: (options as string[]).map(v => v.trim()),
      correctIndex: correctIndex as number,
      points: points as number,
      explanation: explanation.trim(),
    };
  });
}

export function publicQuizItems(items: QuizItem[]) {
  return items.map(({ id, prompt, options, points }) => ({ id, prompt, options, points }));
}

export function gradeQuiz(items: QuizItem[], answers: unknown[]) {
  if (!Array.isArray(answers) || answers.length !== items.length ||
    answers.some((value, index) =>
      !Number.isInteger(value) || (value as number) < -1 ||
      (value as number) >= items[index].options.length)) {
    throw new BadRequestException('Submit one answer per question; use -1 to skip.');
  }
  const total = items.reduce((sum, q) => sum + q.points, 0);
  const earned = items.reduce((sum, q, i) => sum + (q.correctIndex === answers[i] ? q.points : 0), 0);
  const feedback = items.map((q, i) => {
    const correct = q.correctIndex === answers[i];
    return `Câu ${i + 1}: ${correct ? 'Đúng' : 'Chưa đúng'}. Đáp án: ${q.options[q.correctIndex]}.${q.explanation ? ' ' + q.explanation : ''}`;
  }).join('\n');
  return { score: Math.round(100 * earned / total), feedback };
}

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studioAccess: StudioAccessService,
  ) {}

  private canManage(user: AuthenticatedUser, ownerId: string) {
    return user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && user.id === ownerId);
  }

  private async lesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id }, include: { course: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found.');
    return lesson;
  }

  private async exercise(id: string) {
    const exercise = await this.prisma.lessonExercise.findUnique({
      where: { id }, include: { lesson: { include: { course: true } } },
    });
    if (!exercise) throw new NotFoundException('Exercise not found.');
    return exercise;
  }

  private async checkStudent(
    lesson: Awaited<ReturnType<PracticeService['lesson']>>,
    user: AuthenticatedUser,
  ) {
    if (user.role !== UserRole.STUDENT) throw new ForbiddenException('Student access required.');
    if (lesson.course.status !== CourseStatus.PUBLISHED || !lesson.publishedAt)
      throw new NotFoundException('Learning content is not published.');
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } },
      select: { id: true },
    });
    if (!enrollment) throw new ForbiddenException('Course enrollment required.');
  }

  async getForLesson(lessonId: string, user: AuthenticatedUser) {
    const lesson = await this.lesson(lessonId);
    const author = this.canManage(user, lesson.course.createdById);
    if (!author) await this.checkStudent(lesson, user);
    const exercise = await this.prisma.lessonExercise.findUnique({ where: { lessonId } });
    if (!exercise || (!author && !exercise.publishedAt)) return null;
    return author || exercise.kind !== ExerciseKind.QUIZ
      ? exercise
      : { ...exercise, items: publicQuizItems(exercise.items as QuizItem[]) };
  }

  async save(lessonId: string, dto: SaveExerciseDto, user: AuthenticatedUser) {
    const lesson = await this.lesson(lessonId);
    if (!this.canManage(user, lesson.course.createdById))
      throw new ForbiddenException('Only this course lecturer can create exercises.');

    const items = dto.kind === ExerciseKind.QUIZ ? normalizeQuizItems(dto.items) : [];
    if (dto.kind !== ExerciseKind.QUIZ && dto.items.length)
      throw new BadRequestException('Written and project assignments do not use quiz questions.');
    if (dto.dueAt && Number.isNaN(Date.parse(dto.dueAt)))
      throw new BadRequestException('Invalid deadline.');

    const current = await this.prisma.lessonExercise.findUnique({ where: { lessonId } });
    if (current && await this.prisma.exerciseAttempt.count({ where: { exerciseId: current.id } }))
      throw new ConflictException('This assignment has submissions. Create a new lesson to revise the questions without changing past work.');

    const data = {
      kind: dto.kind as ExerciseKind, title: dto.title.trim(),
      instructions: dto.instructions.trim(), items: items as unknown as Prisma.InputJsonValue,
      passingScore: dto.passingScore, maxAttempts: dto.maxAttempts,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      publishedAt: dto.published ? new Date() : null,
    };
    return this.prisma.lessonExercise.upsert({
      where: { lessonId }, create: { ...data, lessonId }, update: data,
    });
  }

  async submit(exerciseId: string, dto: SubmitAttemptDto, user: AuthenticatedUser) {
    const exercise = await this.exercise(exerciseId);
    await this.checkStudent(exercise.lesson, user);
    if (!exercise.publishedAt) throw new NotFoundException('Exercise not published.');
    if (exercise.dueAt && exercise.dueAt < new Date())
      throw new ConflictException('Submission deadline has passed.');
    const total = await this.prisma.exerciseAttempt.count({ where: { exerciseId, userId: user.id } });
    if (total >= exercise.maxAttempts) throw new ConflictException('Attempt limit reached.');

    if (exercise.kind === ExerciseKind.QUIZ) {
      const result = gradeQuiz(exercise.items as QuizItem[], dto.answerIndexes ?? []);
      return this.prisma.exerciseAttempt.create({
        data: {
          exerciseId, userId: user.id,
          answers: { answerIndexes: dto.answerIndexes } as Prisma.InputJsonValue,
          score: result.score, status: ExerciseAttemptStatus.GRADED,
          feedback: result.feedback, reviewedAt: new Date(),
        },
      });
    }
    const text = dto.responseText?.trim() ?? '';
    if (text.length < 10) throw new BadRequestException('Provide a response of at least 10 characters.');
    if (exercise.kind === ExerciseKind.PROJECT) {
      if (!dto.projectId) throw new BadRequestException('Choose the related project.');
      const project = await this.studioAccess.project(dto.projectId, user);
      if (project.courseId !== exercise.lesson.courseId)
        throw new ForbiddenException('Project is not part of this course.');
    } else if (dto.projectId) {
      throw new BadRequestException('Project references are only allowed for project assignments.');
    }
    return this.prisma.exerciseAttempt.create({
      data: {
        exerciseId, userId: user.id,
        answers: { responseText: text, ...(dto.projectId ? { projectId: dto.projectId } : {}) },
        status: ExerciseAttemptStatus.NEEDS_REVIEW,
      },
    });
  }

  async mine(exerciseId: string, user: AuthenticatedUser) {
    const exercise = await this.exercise(exerciseId);
    await this.checkStudent(exercise.lesson, user);
    if (!exercise.publishedAt) throw new NotFoundException('Exercise not published.');
    return this.prisma.exerciseAttempt.findMany({
      where: { exerciseId, userId: user.id },
      orderBy: { createdAt: 'desc' }, take: 20,
    });
  }

  async reviewQueue(exerciseId: string, user: AuthenticatedUser) {
    const exercise = await this.exercise(exerciseId);
    if (!this.canManage(user, exercise.lesson.course.createdById))
      throw new ForbiddenException('This course is not yours to review.');
    return this.prisma.exerciseAttempt.findMany({
      where: { exerciseId },
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' }, take: 100,
    });
  }

  async review(attemptId: string, dto: ReviewAttemptDto, user: AuthenticatedUser) {
    const attempt = await this.prisma.exerciseAttempt.findUnique({
      where: { id: attemptId },
      include: { exercise: { include: { lesson: { include: { course: true } } } } },
    });
    if (!attempt) throw new NotFoundException('Submission not found.');
    if (!this.canManage(user, attempt.exercise.lesson.course.createdById))
      throw new ForbiddenException('You cannot review this submission.');
    if (attempt.exercise.kind === ExerciseKind.QUIZ)
      throw new BadRequestException('Quizzes are graded automatically.');
    if (attempt.status === ExerciseAttemptStatus.GRADED)
      throw new ConflictException('Graded submissions are immutable.');
    return this.prisma.exerciseAttempt.update({
      where: { id: attemptId },
      data: {
        score: dto.score, feedback: dto.feedback.trim(),
        reviewerId: user.id, reviewedAt: new Date(),
        status: ExerciseAttemptStatus.GRADED,
      },
    });
  }
}
