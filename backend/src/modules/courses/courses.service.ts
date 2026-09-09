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

  async findById(id: string, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { orderIndex: 'asc' } },
        createdBy: {
          select: { id: true, email: true, fullName: true, role: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found.');
    }

    this.assertCanView(course, user);
    return course;
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
