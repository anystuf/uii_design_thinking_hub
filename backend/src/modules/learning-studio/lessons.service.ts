import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus, UserRole, type Course } from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCourse(courseId: string, user: AuthenticatedUser) {
    const course = await this.findCourse(courseId);
    this.assertCanViewCourse(course, user);

    if (user.role === UserRole.STUDENT) await this.assertCanAccessLearning(course, user);

    return this.prisma.lesson.findMany({
      where: user.role === UserRole.STUDENT
        ? { courseId, publishedAt: { not: null } }
        : { courseId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async create(
    courseId: string,
    dto: CreateLessonDto,
    user: AuthenticatedUser,
  ) {
    const course = await this.findCourse(courseId);
    this.assertCanMutateCourse(course, user);

    return this.prisma.lesson.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        orderIndex: dto.orderIndex ?? 0,
        durationMinutes: dto.durationMinutes ?? 0,
        contentType: dto.contentType,
        videoUrl: dto.videoUrl,
        content: dto.content,
        publishedAt: dto.isPublished ? new Date() : null,
      },
    });
  }

  async update(id: string, dto: UpdateLessonDto, user: AuthenticatedUser) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }

    this.assertCanMutateCourse(lesson.course, user);

    return this.prisma.lesson.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        orderIndex: dto.orderIndex,
        durationMinutes: dto.durationMinutes,
        contentType: dto.contentType,
        videoUrl: dto.videoUrl,
        content: dto.content,
        publishedAt: dto.isPublished === undefined ? undefined : (dto.isPublished ? new Date() : null),
      },
    });
  }

  async getProgress(id: string, user: AuthenticatedUser) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }

    await this.assertCanAccessLearning(lesson.course, user);
    if (!lesson.publishedAt) throw new NotFoundException('Lesson not published.');

    return this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: id } },
    });
  }

  async updateProgress(
    id: string,
    dto: UpdateLessonProgressDto,
    user: AuthenticatedUser,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }

    await this.assertCanAccessLearning(lesson.course, user);
    if (!lesson.publishedAt) throw new NotFoundException('Lesson not published.');

    const completedAt = dto.completed === undefined
      ? undefined
      : dto.completed
        ? new Date()
        : null;

    return this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: id } },
      create: {
        userId: user.id,
        lessonId: id,
        watchedSeconds: dto.watchedSeconds ?? 0,
        completed: dto.completed ?? false,
        completedAt,
        lastViewedAt: new Date(),
      },
      update: {
        watchedSeconds: dto.watchedSeconds,
        completed: dto.completed,
        completedAt,
        lastViewedAt: new Date(),
      },
    });
  }
  async delete(id: string, user: AuthenticatedUser) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found.');
    }

    this.assertCanMutateCourse(lesson.course, user);
    await this.prisma.lesson.delete({ where: { id } });

    return { success: true };
  }

  private async assertCanAccessLearning(course: Course, user: AuthenticatedUser) {
    this.assertCanViewCourse(course, user);
    if (user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only enrolled students can record lesson progress.');
    }
    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    });
    if (!enrolled || course.status !== CourseStatus.PUBLISHED) {
      throw new ForbiddenException('Course enrollment required.');
    }
  }

  private async findCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    return course;
  }

  private assertCanViewCourse(course: Course, user: AuthenticatedUser) {
    if (
      course.status === CourseStatus.PUBLISHED ||
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && course.createdById === user.id)
    ) {
      return;
    }

    throw new ForbiddenException('Insufficient role for this course.');
  }

  private assertCanMutateCourse(course: Course, user: AuthenticatedUser) {
    if (
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && course.createdById === user.id)
    ) {
      return;
    }

    throw new ForbiddenException('Insufficient role for this action.');
  }
}


