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
    return { stage: 'Bước 1 · Tham gia lớp', title: 'Ghi danh khóa học',
      detail: 'Bạn chưa có khóa học được ghi danh trên hệ thống.', href: '/learn' };
  }
  if (!data.teamCount || !projectId) {
    return { stage: 'Bước 2 · Nhóm dự án', title: 'Vào nhóm và nhận thử thách',
      detail: 'Mở Studio để tham gia nhóm hoặc chấp nhận lời mời.', href: '/studio' };
  }
  const evidenceHref = '/evidence?projectId=' + encodeURIComponent(projectId);
  if (data.activityCount === undefined || data.evidenceCount === undefined ||
      data.completedActivities === undefined || data.submissionStatus === undefined) {
    return { stage: 'Đang xác minh', title: 'Kiểm tra lại dữ liệu nhóm',
      detail: 'Chưa thể xác định tiến độ từ API. Không đánh dấu hoàn thành khi chưa có bằng chứng.',
      href: evidenceHref };
  }
  if (data.submissionStatus === 'SUBMITTED') {
    return { stage: 'Bước 4 · Chờ giảng viên', title: 'Xem bài đã nộp',
      detail: 'Bài nộp đang chờ giảng viên đánh giá; không cần nộp trùng.',
      href: evidenceHref };
  }
  if (data.submissionStatus === 'REVISION_REQUESTED') {
    return { stage: 'Bước 5 · Cải tiến', title: 'Đọc phản hồi và nộp phiên bản mới',
      detail: 'Giảng viên yêu cầu chỉnh sửa. Hãy bổ sung minh chứng rồi nộp lại.',
      href: evidenceHref };
  }
  if (data.submissionStatus === 'APPROVED') {
    return { stage: 'Hoàn thành lượt hiện tại', title: 'Tiếp tục vòng học tiếp theo',
      detail: 'Bài nộp đã được phê duyệt. Bạn có thể quay lại thử nghiệm hoặc giai đoạn khác.',
      href: '/studio' };
  }
  if (!data.activityCount || data.completedActivities === 0) {
    return { stage: 'Bước 3 · Thực hành', title: 'Bắt đầu hoạt động Design Thinking',
      detail: 'Chọn hoạt động trong Studio, nhập kết quả và lưu lại.',
      href: '/studio' };
  }
  if (!data.evidenceCount) {
    return { stage: 'Bước 3 · Minh chứng', title: 'Lưu minh chứng từ hoạt động',
      detail: 'Đính kèm hoặc liên kết minh chứng phù hợp, không công khai dữ liệu phỏng vấn cá nhân.',
      href: evidenceHref };
  }
  return { stage: 'Bước 4 · Gửi bài', title: 'Chọn minh chứng và nộp bài',
    detail: 'Tạo bản nộp có phiên bản để giảng viên phản hồi.',
    href: evidenceHref };
}

export type TeacherClassroomData = {
  courseCount: number;
  publishedChallenges?: number;
  publishedRubrics?: number;
  pendingReviews?: number;
};

export function teacherClassroomNextAction(data: TeacherClassroomData): ClassroomNextAction {
  if (!data.courseCount) return { stage: 'Chuẩn bị lớp', title: 'Tạo khóa học đầu tiên',
    detail: 'Giảng viên cần có khóa học trước khi giao thử thách.', href: '/console' };
  if (data.publishedChallenges === undefined) return { stage: 'Đang xác minh',
    title: 'Kiểm tra lại danh sách thử thách', detail: 'API chưa xác nhận thử thách được xuất bản.', href: '/studio' };
  if (!data.publishedChallenges) return { stage: 'Chuẩn bị hoạt động', title: 'Xuất bản một Design Challenge',
    detail: 'Mở Studio để chuẩn bị hoạt động cho nhóm.', href: '/studio' };
  if (data.publishedRubrics === undefined) return { stage: 'Đang xác minh', title: 'Kiểm tra bộ tiêu chí đánh giá',
    detail: 'Chưa xác nhận rubric đã được xuất bản.', href: '/review' };
  if (!data.publishedRubrics) return { stage: 'Chuẩn bị đánh giá', title: 'Xuất bản rubric trước giờ học',
    detail: 'Bài nộp chỉ được đánh giá bằng phiên bản rubric đã xuất bản.', href: '/review' };
  if (data.pendingReviews === undefined) return { stage: 'Đang xác minh',
    title: 'Kiểm tra hàng đợi bài nộp', detail: 'Chưa xác nhận số lượng bài chờ đánh giá.', href: '/review' };
  if (data.pendingReviews > 0) return { stage: 'Giảng viên · Phản hồi', title: 'Đánh giá bài nộp đang chờ',
    detail: 'Đọc minh chứng, đánh giá bằng rubric và yêu cầu cải tiến hoặc phê duyệt.', href: '/review' };
  return { stage: 'Sẵn sàng cho hoạt động', title: 'Hướng dẫn nhóm bắt đầu trong Studio',
    detail: 'Chưa có bài chờ đánh giá. Hãy yêu cầu sinh viên làm hoạt động và nộp minh chứng.', href: '/studio' };
}
