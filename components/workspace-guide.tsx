"use client";

import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import { useRef, useState } from "react";

export type WorkspaceRole = "STUDENT" | "LECTURER" | "ADMIN" | "MENTOR";
type Guide = { question: string; steps: string[]; href: string; action: string };
const login: Guide = {
  question: "Làm sao để bắt đầu?",
  steps: ["Mở trang đăng nhập. Dùng email và mật khẩu hoặc Google nếu đã được bật.", "Nếu tạo tài khoản mới, hãy kiểm tra email để xác nhận. Quyền giảng viên và quản trị do nhà trường cấp."],
  href: "/learn", action: "Mở trang đăng nhập",
};
const student: Guide[] = [
  { question: "Bắt đầu hoặc tiếp tục học ở đâu?", steps: ["Mở Khóa học, chọn một khóa đang mở và nhấn Ghi danh.", "Vào Tổng quan để mở bài chưa hoàn thành tiếp theo. Đánh dấu hoàn thành ở cuối bài để lưu tiến độ."], href: "/learn#course-catalog", action: "Tìm khóa học" },
  { question: "Tham gia nhóm dự án thế nào?", steps: ["Ghi danh khóa học trước, rồi mở Dự án và chọn thử thách của khóa đó.", "Tạo nhóm hoặc chấp nhận lời mời. Chọn hoạt động thiết kế phù hợp với công việc nhóm đang làm."], href: "/studio", action: "Mở dự án" },
  { question: "Nộp bài và đọc phản hồi ở đâu?", steps: ["Trong Minh chứng & phản hồi, chọn dự án và lưu tệp hoặc ghi chép của nhóm.", "Chọn phiên bản minh chứng để nộp. Khi có nhận xét, mở Thông báo để xem bài và các điểm cần cải thiện."], href: "/evidence", action: "Mở minh chứng" },
];
const teaching: Guide[] = [
  { question: "Tạo và công bố khóa học thế nào?", steps: ["Mở Khóa học và tạo một bản nháp.", "Chọn khóa vừa tạo để thêm bài học, sau đó công bố bài và khóa khi nội dung đã sẵn sàng."], href: "/learn", action: "Quản lý khóa học" },
  { question: "Giao thử thách cho lớp thế nào?", steps: ["Mở Dự án, chọn khóa học mình quản lý rồi tạo thử thách.", "Nêu rõ đầu ra, thiết lập mốc nộp và công bố để sinh viên có thể tham gia."], href: "/studio", action: "Quản lý thử thách" },
  { question: "Chấm bài và gửi phản hồi thế nào?", steps: ["Vào Đánh giá, chọn thử thách và công bố bộ tiêu chí.", "Chọn bài trong danh sách chờ, chấm theo tiêu chí và ghi rõ bước cải thiện trước khi gửi phản hồi."], href: "/review", action: "Mở hàng chờ đánh giá" },
];
const admin: Guide = {
  question: "Kiểm tra tài khoản và quyền ở đâu?",
  steps: ["Mở Quản trị để xem danh sách tài khoản và vai trò đang được hệ thống ghi nhận.", "Khi cần cấp hoặc đổi quyền, dùng quy trình quản trị được nhà trường phê duyệt."],
  href: "/admin", action: "Mở danh sách tài khoản",
};
const mentor: Guide = {
  question: "Tìm dự án được chia sẻ với tôi ở đâu?",
  steps: ["Mở Dự án để xem các mục tài khoản của bạn có quyền truy cập.", "Nếu không thấy dự án, hãy hỏi giảng viên quản lý khóa học về quyền truy cập."],
  href: "/studio", action: "Mở dự án",
};
const guides = { STUDENT: student, LECTURER: teaching, ADMIN: [admin, ...teaching], MENTOR: [mentor] };

export function WorkspaceGuide({ role, triggerClassName }: { role?: WorkspaceRole; triggerClassName?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Guide | null>(null);
  const topics = role ? guides[role] : [login];
  return (
    <>
      <button type="button" onClick={() => { setSelected(null); dialog.current?.showModal(); }}
        className={"flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold " + (triggerClassName ?? "text-slate-700 hover:bg-slate-100")}>
        <MessageCircle aria-hidden="true" size={17}/> <span>Trợ giúp</span>
      </button>
      <dialog ref={dialog} aria-labelledby="workspace-guide-title"
        className="m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/45">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 id="workspace-guide-title" className="text-base font-semibold">Hướng dẫn sử dụng</h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Đóng hướng dẫn"
            className="grid size-11 place-items-center rounded-md hover:bg-slate-100"><X size={18} aria-hidden="true"/></button>
        </div>
        <div className="space-y-4 p-4">
          <p className="text-sm text-slate-600">Bạn muốn làm gì trên nền tảng?</p>
          <div className="grid gap-2">
            {topics.map(topic => (
              <button key={topic.question} type="button" onClick={() => setSelected(topic)} aria-pressed={selected === topic}
                className="min-h-11 rounded-md border border-slate-200 px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50 aria-pressed:border-blue-700 aria-pressed:bg-blue-50">
                {topic.question}
              </button>
            ))}
          </div>
          {selected && topics.includes(selected) && (
            <div className="rounded-lg bg-slate-50 p-3">
              <ol aria-live="polite" className="list-decimal space-y-2 pl-5 text-sm leading-6">
                {selected.steps.map(step => <li key={step}>{step}</li>)}
              </ol>
              <Link href={selected.href} onClick={() => dialog.current?.close()}
                className="mt-2 inline-flex min-h-11 items-center font-semibold text-[#153b77] underline">{selected.action}</Link>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
