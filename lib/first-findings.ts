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
  { key: 'problem', label: 'Vấn đề cụ thể là gì?', hint: 'Không viết giải pháp mà nhóm đã chọn.' },
  { key: 'proof', label: 'Làm sao biết vấn đề có thật? Nguồn nào?', hint: 'Ghi quan sát hoặc nguồn dẫn chứng; phân biệt dữ kiện và giả định.' },
  { key: 'affectedPeople', label: 'Ai đang gặp vấn đề này?', hint: 'Mô tả nhóm người dùng, không ghi tên/số điện thoại người được phỏng vấn.' },
  { key: 'currentResponse', label: 'Họ đang xử lý khó khăn thế nào?', hint: 'Tìm cả giải pháp họ đang dùng, dù chưa hiệu quả.' },
  { key: 'resourcesInUse', label: 'Họ đang dùng nguồn lực gì để ứng phó?', hint: 'Thời gian, chi phí, thiết bị, quan hệ hoặc cách làm hiện tại.' },
  { key: 'value', label: 'Vì sao vấn đề đáng để giải quyết?', hint: 'Giá trị với người dùng và phạm vi nhóm có thể thực hiện.' },
] as const satisfies ReadonlyArray<{ key: keyof FirstFindingsProblem; label: string; hint: string }>;

export const EMPTY_FIRST_FINDINGS_PROBLEM: FirstFindingsProblem = {
  problem: '', proof: '', affectedPeople: '', currentResponse: '',
  resourcesInUse: '', value: '',
};

export const FIRST_FINDINGS_TITLE = 'Activity 2 · First Findings — hai vấn đề';

function formatProblem(problem: FirstFindingsProblem, index: number) {
  return [
    'ACTIVITY 2 — FIRST FINDINGS',
    'VẤN ĐỀ ' + index,
    ...FIRST_FINDINGS_FIELDS.map(field => field.label + '\\n' + problem[field.key].trim()),
  ].join('\\n\\n');
}

export function buildFirstFindingsEvidence(
  first: FirstFindingsProblem, second: FirstFindingsProblem, teamScope: string,
) {
  const description = formatProblem(first, 1);
  const reflection = formatProblem(second, 2) +
    '\\n\\nGIỚI HẠN NGUỒN LỰC CỦA NHÓM\\n' + teamScope.trim();
  if (description.length > 3000 || reflection.length > 3000) {
    throw new Error('Nội dung dài hơn giới hạn lưu trữ; hãy rút gọn từng câu trả lời.');
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
