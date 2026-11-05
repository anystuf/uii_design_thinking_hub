import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

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
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
    }),
    PrismaModule,
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
  ],
})
export class AppModule {}

