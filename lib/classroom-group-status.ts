/**
 * Classroom board uses backend-confirmed evidence and submission states.
 * No derived statuses are marked complete from UI clicks or mock data.
 */
export type PilotGroupStatus = 'UNKNOWN' | 'NOT_STARTED' | 'EVIDENCE' |
  'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED';

export function groupPilotStatus(
  evidenceCount: number | undefined,
  submissions: readonly { status: string; submittedAt: string; version: number }[] | undefined,
): PilotGroupStatus {
  if (evidenceCount === undefined || submissions === undefined) return 'UNKNOWN';
  const latest = [...submissions].sort((a, b) =>
    Date.parse(b.submittedAt) - Date.parse(a.submittedAt) || b.version - a.version)[0];
  if (latest) {
    if (latest.status === 'SUBMITTED' || latest.status === 'REVISION_REQUESTED' ||
        latest.status === 'APPROVED') return latest.status;
    return 'UNKNOWN';
  }
  return evidenceCount > 0 ? 'EVIDENCE' : 'NOT_STARTED';
}

export const PILOT_GROUP_LABELS: Record<PilotGroupStatus, string> = {
  UNKNOWN: 'Chưa xác minh',
  NOT_STARTED: 'Chưa lưu minh chứng',
  EVIDENCE: 'Có minh chứng · chưa nộp',
  SUBMITTED: 'Đã nộp · chờ phản hồi',
  REVISION_REQUESTED: 'Cần cải tiến',
  APPROVED: 'Đã phê duyệt',
};
