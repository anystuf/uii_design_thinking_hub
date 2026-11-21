import type { ThinkingStage } from "./stage-experience";

type Challenge = { id: string; status: string };
type Team = { id: string; challengeId: string };
type Template = { id: string; mode: ThinkingStage };
type Activity = { id: string; mode: ThinkingStage; status: string; templateId: string };

export type StudioGuidedStep = {
  kind: "enroll" | "choose-challenge" | "await-challenge" | "accept-invitation" |
        "choose-team" | "create-team" | "resume" | "start" | "evidence" | "explore";
  title: string;
  explanation: string;
  action: string;
  resourceId?: string;
  href?: string;
};

export function getStudioGuidedStep(input: {
  courseId: string;
  challenges: Challenge[];
  challengeId: string | null;
  teamId: string | null;
  myTeams: Team[];
  invitationCount: number;
  templates: Template[];
  activities: Activity[];
  mode: ThinkingStage;
}): StudioGuidedStep {
  const { courseId, challenges, challengeId, teamId, myTeams,
    invitationCount, templates, activities, mode } = input;

  if (!courseId) return {
    kind: "enroll", title: "Chọn khóa học để bắt đầu",
    explanation: "Ghi danh một khóa học để tìm thử thách của lớp. Không cần tạo dự án trước khi biết mình muốn giải quyết vấn đề gì.",
    action: "Khám phá khóa học", href: "/learn",
  };

  if (!challengeId) {
    const next = challenges.find(item => item.status === "PUBLISHED");
    if (next) return {
      kind: "choose-challenge", title: "Khám phá một thử thách thực tế",
      explanation: "Đọc bối cảnh và chọn vấn đề bạn muốn tìm hiểu. Chưa có thao tác nào làm thay đổi dữ liệu của nhóm.",
      action: "Xem thử thách", resourceId: next.id,
    };
    return {
      kind: "await-challenge", title: "Chưa có thử thách để tham gia",
      explanation: "Giảng viên cần công bố một thử thách trước. Bạn vẫn có thể xem hai nhóm ví dụ hoặc học tiếp trong khóa học.",
      action: "Quay về khóa học", href: "/learn?course=" + encodeURIComponent(courseId),
    };
  }

  if (!teamId) {
    const existing = myTeams.find(item => item.challengeId === challengeId);
    if (existing) return {
      kind: "choose-team", title: "Tiếp tục cùng nhóm của bạn",
      explanation: "Nhóm đã tồn tại. Mở lại để tiếp tục bài làm, không cần tạo nhóm khác.",
      action: "Mở không gian nhóm", resourceId: existing.id,
    };
    if (invitationCount > 0) return {
      kind: "accept-invitation", title: "Bạn có lời mời tham gia nhóm",
      explanation: "Xem lời mời trước khi tạo nhóm mới. Bạn có quyền chấp nhận hoặc từ chối.",
      action: "Xem lời mời",
    };
    return {
      kind: "create-team", title: "Tạo không gian cho nhóm của bạn",
      explanation: "Đặt tên nhóm để lưu các hoạt động thật. Bạn có thể mời thành viên sau.",
      action: "Đặt tên nhóm",
    };
  }

  const inMode = activities.filter(item => item.mode === mode);
  const draft = inMode.find(item => item.status === "DRAFT");
  if (draft) return {
    kind: "resume", title: "Tiếp tục bản nháp đang làm",
    explanation: "Công việc trước đó đã được lưu trên máy chủ. Mở lại và hoàn thiện khi bạn sẵn sàng.",
    action: "Mở bản nháp", resourceId: draft.id,
  };

  const completed = inMode.some(item => item.status === "COMPLETED");
  if (completed) return {
    kind: "evidence", title: "Bạn đã hoàn thành một hoạt động",
    explanation: "Đã có sản phẩm ở giai đoạn này. Lưu minh chứng và xin nhận xét, hoặc thử góc nhìn khác khi cần.",
    action: "Lưu minh chứng", href: "/evidence?projectId=" + encodeURIComponent(teamId),
  };

  const first = templates.find(item => item.mode === mode);
  if (first) return {
    kind: "start", title: "Thử một phương pháp nhỏ",
    explanation: "Không cần hiểu hết Design Thinking. Hãy mở một mẫu, trả lời câu hỏi đầu tiên và lưu bản nháp.",
    action: "Bắt đầu hoạt động", resourceId: first.id,
  };

  return {
    kind: "explore", title: "Chọn một cách tiếp cận khác",
    explanation: "Chưa có mẫu cho góc nhìn này. Bạn có thể chuyển giữa năm chế độ bất cứ lúc nào, không bị khóa theo thứ tự.",
    action: "Khám phá các phương pháp",
  };
}
