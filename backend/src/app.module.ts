import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { configValidationSchema } from './config/config.validation';
import { PrismaModule } from './database/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CommunityModule } from './modules/community/community.module';
import { LearningStudioModule } from './modules/learning-studio/learning-studio.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { UploadModule } from './modules/upload/upload.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { SnapshotSubmissionsModule } from './modules/snapshot-submissions/snapshot-submissions.module';
import { UsersModule } from './modules/users/users.module';
import { RubricsModule } from './modules/rubrics/rubrics.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
    }),
    PrismaModule,
    ScheduleModule.forRoot(),
    HealthModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    CommunityModule,
    LearningStudioModule,
    UploadModule,
    ProjectsModule,
    ChallengesModule,
    TeamsModule,
    ActivitiesModule,
    EvidenceModule,
    SnapshotSubmissionsModule,
    RubricsModule,
    AssessmentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}

