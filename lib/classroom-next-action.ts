export type StudentClassroomData = {
  enrollmentCount: number;
  teamCount: number;
  activityCount?: number;
  completedActivities?: number;
  evidenceCount?: number;
  submissionStatus?: string | null;
};

export type ClassroomNextAction = {
  title: string;
  detail: string;
  href: string;
  stage: string;
};

/** A suggested next action derived only from confirmed server responses. */
export function studentClassroomNextAction(data: StudentClassroomData, projectId?: string): ClassroomNextAction {
  if (!data.enrollmentCount) {
    return { stage: 'Step 1 · Join class', title: 'Enroll in course',
      detail: 'You are not enrolled in any courses yet.', href: '/learn' };
  }
  if (!data.teamCount || !projectId) {
    return { stage: 'Step 2 · Project team', title: 'Join a team and choose a challenge',
      detail: 'Open Studio to join a team or accept an invitation.', href: '/studio' };
  }
  const evidenceHref = '/evidence?projectId=' + encodeURIComponent(projectId);
  if (data.activityCount === undefined || data.evidenceCount === undefined ||
      data.completedActivities === undefined || data.submissionStatus === undefined) {
    return { stage: 'Verifying data', title: 'Recheck team data',
      detail: 'The API has not confirmed progress. Nothing is marked complete without evidence.',
      href: evidenceHref };
  }
  if (data.submissionStatus === 'SUBMITTED') {
    return { stage: 'Step 4 · Await review', title: 'View submitted work',
      detail: 'Your submission is awaiting lecturer review. Do not submit a duplicate.',
      href: evidenceHref };
  }
  if (data.submissionStatus === 'REVISION_REQUESTED') {
    return { stage: 'Step 5 · Revise', title: 'Read feedback and submit a new version',
      detail: 'Your lecturer requested revisions. Update the evidence and submit again.',
      href: evidenceHref };
  }
  if (data.submissionStatus === 'APPROVED') {
    return { stage: 'Current cycle complete', title: 'Continue the next learning cycle',
      detail: 'Your submission was approved. Continue testing or revisit another design stage.',
      href: '/studio' };
  }
  if (!data.activityCount || data.completedActivities === 0) {
    // A learner may have completed Activity 2 as versioned evidence before
    // doing a Studio template. Do not send them back to a fictitious "start".
    if (data.evidenceCount > 0) {
      return { stage: 'Step 3 · Prepare submission', title: 'Attach your slide and select evidence',
        detail: 'Evidence was saved. Prepare the deliverable and submit a snapshot; it is not submitted yet.',
        href: evidenceHref };
    }
    return { stage: 'Step 3 · Practise', title: 'Start a Design Thinking activity',
      detail: 'Choose an activity in Studio, enter your findings, and save.',
      href: '/studio' };
  }
  if (!data.evidenceCount) {
    return { stage: 'Step 3 · Evidence', title: 'Save activity evidence',
      detail: 'Attach or link suitable evidence without publishing interviewee information.',
      href: evidenceHref };
  }
  return { stage: 'Step 4 · Submit', title: 'Select evidence and submit',
    detail: 'Create a versioned snapshot for lecturer feedback.',
    href: evidenceHref };
}

export type TeacherClassroomData = {
  courseCount: number;
  publishedChallenges?: number;
  publishedRubrics?: number;
  pendingReviews?: number;
};

export function teacherClassroomNextAction(data: TeacherClassroomData): ClassroomNextAction {
  if (!data.courseCount) return { stage: 'Prepare classroom', title: 'Create your first course',
    detail: 'Create a course before assigning a challenge.', href: '/console' };
  if (data.publishedChallenges === undefined) return { stage: 'Verifying data',
    title: 'Recheck challenges', detail: 'Published challenges have not been verified by the API.', href: '/studio' };
  if (!data.publishedChallenges) return { stage: 'Prepare activity', title: 'Publish a Design Challenge',
    detail: 'Open Studio to prepare the team activity.', href: '/studio' };
  if (data.publishedRubrics === undefined) return { stage: 'Verifying data', title: 'Verify the rubric',
    detail: 'The published rubric has not been verified.', href: '/review' };
  if (!data.publishedRubrics) return { stage: 'Prepare assessment', title: 'Publish the rubric before class',
    detail: 'Assess submissions only with a published rubric version.', href: '/review' };
  if (data.pendingReviews === undefined) return { stage: 'Verifying data',
    title: 'Check the submission queue', detail: 'The API has not confirmed the pending review count.', href: '/review' };
  if (data.pendingReviews > 0) return { stage: 'Lecturer · Review', title: 'Review pending submissions',
    detail: 'Read evidence, assess against the rubric, then request revisions or approve.', href: '/review' };
  return { stage: 'Ready for class', title: 'Guide teams to begin in Studio',
    detail: 'No submissions are awaiting review. Ask students to complete their activity and submit evidence.', href: '/studio' };
}
