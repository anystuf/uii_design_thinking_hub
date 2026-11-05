import {
  ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import {
  ChallengeStatus, CourseStatus, UserRole,
} from '@prisma/client';

import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class StudioAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async lecturerCourse(courseId: string, user: AuthenticatedUser) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found.');
    if (
      user.role !== UserRole.ADMIN &&
      !(user.role === UserRole.LECTURER && course.createdById === user.id)
    ) throw new ForbiddenException('Only the course lecturer can manage its studio.');
    return course;
  }

  async enrolledStudent(courseId: string, user: AuthenticatedUser) {
    if (user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('This action requires a student.');
    }
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.status !== CourseStatus.PUBLISHED) {
      throw new NotFoundException('Published course not found.');
    }
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Course enrollment required.');
    return course;
  }

  async challenge(challengeId: string, user: AuthenticatedUser) {
    const challenge = await this.prisma.designChallenge.findUnique({
      where: { id: challengeId },
      include: { course: true },
    });
    if (!challenge) throw new NotFoundException('Challenge not found.');
    if (
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && challenge.course.createdById === user.id)
    ) return challenge;
    if (challenge.status === ChallengeStatus.DRAFT) {
      throw new NotFoundException('Challenge not published.');
    }
    await this.enrolledStudent(challenge.courseId, user);
    return challenge;
  }

  async project(projectId: string, user: AuthenticatedUser, write = false, ownerOnly = false) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { course: { select: { createdById: true } } },
    });
    if (!project) throw new NotFoundException('Project not found.');
    if (user.role === UserRole.ADMIN) return project;

    if (!write && user.role === UserRole.LECTURER && project.course.createdById === user.id) {
      return project;
    }
    if (user.role !== UserRole.STUDENT) throw new ForbiddenException('Project access denied.');

    if (project.ownerId === user.id) return project;
    if (!ownerOnly) {
      const member = await this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: user.id } },
      });
      if (member) return project;
    }
    throw new ForbiddenException('Not a member of this project.');
  }
}
