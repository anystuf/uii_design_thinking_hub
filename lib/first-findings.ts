/**
 * Guided "Activity 2 — First findings" from Ms Thanh's chapter 10,
 * slides 64–65. This is a learner scaffold, not a claim that user evidence is verified.
 * No public roster, interview identities, or demo data are stored here.
 */
export type FirstFindingsProblem = {
  problem: string;
  proof: string;
  affectedPeople: string;
  currentResponse: string;
  resourcesInUse: string;
  value: string;
};

export const FIRST_FINDINGS_FIELDS = [
  { key: 'problem', label: 'What is the specific problem?', hint: 'Describe the problem, not a solution your team has already chosen.' },
  { key: 'proof', label: 'How do you know this problem is real? What is your source?', hint: 'Include observations or references; distinguish facts from assumptions.' },
  { key: 'affectedPeople', label: 'Who is affected by this problem?', hint: 'Describe the people affected; do not include interviewee names or phone numbers.' },
  { key: 'currentResponse', label: 'How are they currently dealing with this problem?', hint: 'Include existing workarounds, even if they are not effective.' },
  { key: 'resourcesInUse', label: 'What resources are they using to cope?', hint: 'Consider time, money, equipment, support networks, and current methods.' },
  { key: 'value', label: 'Why is this problem worth solving?', hint: 'Explain the value for users and what is achievable within the team's scope.' },
] as const satisfies ReadonlyArray<{ key: keyof FirstFindingsProblem; label: string; hint: string }>;

export const EMPTY_FIRST_FINDINGS_PROBLEM: FirstFindingsProblem = {
  problem: '', proof: '', affectedPeople: '', currentResponse: '',
  resourcesInUse: '', value: '',
};

export const FIRST_FINDINGS_TITLE = 'Activity 2 · First Findings — hai vấn đề';

function formatProblem(problem: FirstFindingsProblem, index: number) {
  return [
    'ACTIVITY 2 — FIRST FINDINGS',
    'PROBLEM ' + index,
    ...FIRST_FINDINGS_FIELDS.map(field => field.label + '\n' + problem[field.key].trim()),
  ].join('\n\n');
}

export function buildFirstFindingsEvidence(
  first: FirstFindingsProblem, second: FirstFindingsProblem, teamScope: string,
) {
  const description = formatProblem(first, 1);
  const reflection = formatProblem(second, 2) +
    '\n\nTEAM RESOURCES AND CONSTRAINTS\n' + teamScope.trim();
  if (description.length > 3000 || reflection.length > 3000) {
    throw new Error('The response exceeds the storage limit. Shorten each answer.');
  }
  return {
    mode: 'DEFINE' as const,
    type: 'DOCUMENT' as const,
    title: FIRST_FINDINGS_TITLE,
    description,
    reflection,
  };
}

export function firstFindingsComplete(
  first: FirstFindingsProblem, second: FirstFindingsProblem, teamScope: string,
) {
  return !!teamScope.trim() && [first, second].every(problem =>
    FIRST_FINDINGS_FIELDS.every(field => !!problem[field.key].trim()),
  );
}

/** We recognize only actual, persisted evidence with the pilot title. */
export function isFirstFindingsEvidence(item: { title: string; versions?: unknown[] }) {
  return item.title === FIRST_FINDINGS_TITLE && !!item.versions?.length;
}
