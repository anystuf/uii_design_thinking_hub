import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CourseStatus,
  UserRole,
  type Course,
} from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { calculateLearningRewards } from './learning-rewards';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser) {
    const where =
      user.role === UserRole.ADMIN
        ? {}
        : user.role === UserRole.LECTURER
          ? {
              OR: [
                { status: CourseStatus.PUBLISHED },
                { createdById: user.id },
              ],
            }
          : { status: CourseStatus.PUBLISHED };

    return this.prisma.course.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, email: true, fullName: true, role: true },
        },
        _count: {
          select: { lessons: true, enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myEnrollments(user: AuthenticatedUser) {
    if (user.role !== UserRole.STUDENT) throw new ForbiddenException('Student access required.');
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: user.id, course: { status: CourseStatus.PUBLISHED } },
      include: { course: { select: { id: true, title: true, description: true, status: true, level: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    const courseIds = enrollments.map(item => item.courseId);
    // Two bulk reads, independent of the number of enrolled courses.
    const lessons = courseIds.length ? await this.prisma.lesson.findMany({
      where: { courseId: { in: courseIds }, publishedAt: { not: null } },
      select: { id: true, title: true, courseId: true },
      orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
    }) : [];
    const records = lessons.length ? await this.prisma.lessonProgress.findMany({
      where: { userId: user.id, lessonId: { in: lessons.map(lesson => lesson.id) } },
      select: { lessonId: true, completed: true },
    }) : [];
    const completed = new Set(records.filter(item => item.completed).map(item => item.lessonId));
    const byCourse = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const group = byCourse.get(lesson.courseId) ?? [];
      group.push(lesson); byCourse.set(lesson.courseId, group);
    }
    return enrollments.map(item => {
      const curriculum = byCourse.get(item.courseId) ?? [];
      const count = curriculum.filter(lesson => completed.has(lesson.id)).length;
      const next = curriculum.find(lesson => !completed.has(lesson.id));
      return { ...item, progress: {
        totalLessons: curriculum.length, completedLessons: count,
        percent: curriculum.length ? Math.round(count * 100 / curriculum.length) : 0,
        nextLesson: next ? { id: next.id, title: next.title } : null,
      } };
    });
  }

  async myRewards(id: string, user: AuthenticatedUser) {
    if (user.role !== UserRole.STUDENT) throw new ForbiddenException('Student access required.');

    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: id } },
      select: { id: true },
    });
    if (!enrolled) throw new ForbiddenException('Course enrollment required.');

    // All points are calculated from authorized published learning records.
    const [lessons, exercises] = await Promise.all([
      this.prisma.lesson.findMany({
        where: { courseId: id, publishedAt: { not: null } },
        select: { id: true },
      }),
      this.prisma.lessonExercise.findMany({
        where: { publishedAt: { not: null }, lesson: { courseId: id, publishedAt: { not: null } } },
        select: { id: true, passingScore: true },
      }),
    ]);
    const [progress, attempts] = await Promise.all([
      lessons.length ? this.prisma.lessonProgress.findMany({
        where: { userId: user.id, lessonId: { in: lessons.map(lesson => lesson.id) }, completed: true },
        select: { lessonId: true },
      }) : Promise.resolve([]),
      exercises.length ? this.prisma.exerciseAttempt.findMany({
        where: { userId: user.id, exerciseId: { in: exercises.map(exercise => exercise.id) }, status: 'GRADED' },
        select: { exerciseId: true, score: true },
      }) : Promise.resolve([]),
    ]);

    return {
      courseId: id,
      ...calculateLearningRewards(
        lessons.map(lesson => lesson.id),
        progress.map(record => record.lessonId),
        exercises,
        attempts,
      ),
    };
  }

  async myProgress(id: string, user: AuthenticatedUser) {
    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: id } },
    });
    if (!enrolled) throw new ForbiddenException('Course enrollment required.');

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId: id, publishedAt: { not: null } },
      select: { id: true },
    });
    const ids = lessons.map((lesson) => lesson.id);
    const progress = ids.length
      ? await this.prisma.lessonProgress.findMany({
          where: { userId: user.id, lessonId: { in: ids } },
          select: { lessonId: true, completed: true },
        })
      : [];
    const completed = progress.filter((record) => record.completed).length;
    return {
      courseId: id,
      totalLessons: lessons.length,
      completedLessons: completed,
      percent: lessons.length ? Math.round(completed * 100 / lessons.length) : 0,
      lessons: progress,
    };
  }

  async findById(id: string, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found.');
    this.assertCanView(course, user);

    const enrolled = user.role === UserRole.STUDENT
      ? Boolean(await this.prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: id } },
        }))
      : true;

    const canManage = user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && course.createdById === user.id);

    return this.prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          where: canManage
            ? {}
            : enrolled
              ? { publishedAt: { not: null } }
              : { isPreview: true, publishedAt: { not: null } },
          orderBy: { orderIndex: 'asc' },
        },
        createdBy: {
          select: { id: true, email: true, fullName: true, role: true },
        },
      },
    });
  }

  async create(dto: CreateCourseDto, user: AuthenticatedUser) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.LECTURER) {
      throw new ForbiddenException('Insufficient role for this action.');
    }

    await this.ensureDevUser(user);

    return this.prisma.course.create({
      data: {
        title: dto.title,
        slug: dto.slug ?? createSlug(dto.title),
        description: dto.description,
        status: dto.status ?? CourseStatus.DRAFT,
        level: dto.level,
        sprintPhase: dto.sprintPhase,
        createdById: user.id,
      },
    });
  }

  async update(id: string, dto: UpdateCourseDto, user: AuthenticatedUser) {
    const course = await this.findCourseForMutation(id);
    this.assertCanMutate(course, user);

    return this.prisma.course.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        status: dto.status,
        level: dto.level,
        sprintPhase: dto.sprintPhase,
      },
    });
  }

  async delete(id: string, user: AuthenticatedUser) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete courses.');
    }

    await this.findCourseForMutation(id);
    await this.prisma.course.delete({ where: { id } });

    return { success: true };
  }

  async enroll(id: string, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course || course.status !== CourseStatus.PUBLISHED) {
      throw new NotFoundException('Published course not found.');
    }

    await this.ensureDevUser(user);

    return this.prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: id,
        },
      },
      create: {
        userId: user.id,
        courseId: id,
      },
      update: {},
    });
  }

  private async findCourseForMutation(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    return course;
  }

  private assertCanView(course: Course, user: AuthenticatedUser) {
    if (
      course.status === CourseStatus.PUBLISHED ||
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && course.createdById === user.id)
    ) {
      return;
    }

    throw new ForbiddenException('Insufficient role for this course.');
  }

  private assertCanMutate(course: Course, user: AuthenticatedUser) {
    if (
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && course.createdById === user.id)
    ) {
      return;
    }

    throw new ForbiddenException('Insufficient role for this action.');
  }

  private async ensureDevUser(user: AuthenticatedUser) {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      update: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  }
}

function createSlug(value: string): string {
  const base = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `${base || 'course'}-${Date.now()}`;
}
