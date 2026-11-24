/** Points are a read-only reflection of verified learning records.
 * No daily streaks, no time pressure, no penalties and no points from UI clicks.
 */
export const LESSON_XP = 20;
export const PRACTICE_XP = 40;

export type EligibleExercise = { id: string; passingScore: number };
export type GradedExerciseAttempt = { exerciseId: string; score: number | null };

export function calculateLearningRewards(
  publishedLessonIds: string[],
  completedLessonIds: string[],
  publishedExercises: EligibleExercise[],
  gradedAttempts: GradedExerciseAttempt[],
) {
  const published = new Set(publishedLessonIds);
  const completed = new Set(completedLessonIds.filter(id => published.has(id)));
  const thresholds = new Map(publishedExercises.map(exercise => [exercise.id, exercise.passingScore]));
  const passed = new Set<string>();
  for (const attempt of gradedAttempts) {
    const passingScore = thresholds.get(attempt.exerciseId);
    if (passingScore !== undefined && attempt.score !== null && attempt.score >= passingScore) {
      passed.add(attempt.exerciseId);
    }
  }

  return {
    xp: completed.size * LESSON_XP + passed.size * PRACTICE_XP,
    possibleXp: published.size * LESSON_XP + thresholds.size * PRACTICE_XP,
    completedLessons: completed.size,
    totalLessons: published.size,
    passedExercises: passed.size,
    totalExercises: thresholds.size,
    unit: 'XP',
    pointsPolicy: '20 XP / completed published lesson; 40 XP / distinct published exercise passed; no daily streak',
  };
}
