"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import type { WorkspaceRole } from "./workspace-guide";

type Reply = { text: string; href?: string; action?: string };
type Message = Reply & { id: number; from: "bot" | "user" };

const roleQuestions: Record<WorkspaceRole | "GUEST", string[]> = {
  GUEST: ["Làm sao để đăng nhập?", "Tôi muốn tìm khóa học"],
  STUDENT: ["Làm sao để ghi danh khóa học?", "Tôi làm quiz ở đâu?", "Nộp bài dự án thế nào?", "Xem phản hồi của giảng viên"],
  LECTURER: ["Tạo bài quiz thế nào?", "Chấm bài tự luận ở đâu?", "Tạo khóa học mới"],
  ADMIN: ["Quản lý tài khoản", "Tạo bài tập cho khóa học", "Xem bài chờ chấm"],
  MENTOR: ["Tôi xem dự án ở đâu?", "Làm sao để bắt đầu?"],
};
const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
  .toLowerCase().replace(/\s+/g, " ").trim();

export function respondToGuide(message: string, role?: WorkspaceRole, path = "/dashboard"): Reply {
  const q = strip(message);
  const student = role === "STUDENT";
  const teacher = role === "LECTURER" || role === "ADMIN";
  if (/dang nhap|mat khau|sign in|dang ky|google/.test(q)) {
    return { text: "Mở Khóa học và chọn Đăng nhập hoặc Đăng ký. Nếu dùng Google, nhà trường cần bật Google OAuth trong Supabase. Bạn không cần gửi mật khẩu cho trợ lý.", href: "/learn", action: "Mở trang đăng nhập" };
  }
  if (/quiz|trac nghiem|bai tap|luyen tap|practice|kiem tra/.test(q)) {
    if (teacher) return { text: "Mở Khóa học, chọn khóa mình quản lý, vào một bài học và nhấn Tạo bài tập tại mục Luyện tập và bài tập. Chọn Quiz, Tự luận hoặc Bài dự án; nhập nội dung, hạn nộp và bật Công bố. Quiz được chấm tự động, các bài khác chờ giảng viên chấm.", href: "/learn", action: "Mở công cụ tạo bài tập" };
    if (student) return { text: "Vào Khóa học → chọn khóa đã ghi danh → mở bài học → kéo tới mục Luyện tập và bài tập. Trả lời các câu hỏi rồi nhấn Nộp bài. Quiz có điểm và lời giải; tự luận/bài dự án sẽ được giảng viên phản hồi.", href: "/learn", action: "Mở khóa học của tôi" };
    return { text: "Bài luyện tập nằm trong từng bài học. Bạn cần đăng nhập và ghi danh để thực hiện quiz hoặc nộp bài.", href: "/learn", action: "Đến khóa học" };
  }
  if (/nop|upload|tep|file|minh chung|evidence|san pham/.test(q)) {
    if (teacher) return { text: "Với bài tập tự luận, mở bài học rồi chọn Bài đã nộp để chấm điểm và gửi nhận xét. Bài nộp dự án, minh chứng và đánh giá theo rubric nằm ở Đánh giá bài nộp.", href: "/review", action: "Mở đánh giá bài nộp" };
    return { text: "Đối với bài dự án: vào Minh chứng & phản hồi để tải tệp và ghi nhận sản phẩm, sau đó trở lại bài tập trong Khóa học, chọn đúng dự án và gửi mô tả công việc. Bạn phải là thành viên có quyền truy cập dự án.", href: "/evidence", action: "Mở minh chứng" };
  }
  if (/cham|diem|nhan xet|phan hoi|ket qua|rubric|grading/.test(q)) {
    if (teacher) return { text: "Mở Khóa học → chọn bài học → Bài đã nộp để chấm tự luận. Bạn nhập điểm 0–100 và nhận xét. Với dự án lớn, hãy dùng trang Đánh giá bài nộp và rubric.", href: "/review", action: "Mở đánh giá" };
    return { text: "Ngay dưới phần Luyện tập có Lịch sử làm bài. Quiz hiển thị điểm và giải thích sau khi nộp; bài tự luận sẽ hiện kết quả khi giảng viên đã chấm. Phản hồi dự án cũng nằm trong Thông báo.", href: "/learn", action: "Mở bài học" };
  }
  if (/nhom|du an|studio|team|empathy|persona|prototype|design thinking/.test(q)) {
    return { text: "Design Studio là nơi thực hành cùng nhóm: khám phá thử thách, tham gia nhóm, làm Empathy Map, Define, Ideate, Prototype và Test. Sinh viên có thể quay lại bất kỳ chế độ nào để cải tiến.", href: "/studio", action: "Mở Design Studio" };
  }
  if (/tai khoan|quyen|role|admin|quan tri/.test(q)) {
    if (role === "ADMIN") return { text: "Vào Quản trị để xem danh sách tài khoản và vai trò đã xác minh. Các thay đổi quyền cần thực hiện theo quy trình quản trị được ủy quyền.", href: "/admin", action: "Mở quản trị" };
    return { text: "Tài khoản mới có quyền Sinh viên. Quyền Giảng viên và Quản trị viên phải được người có thẩm quyền cấp; không thể tự chọn trong giao diện.", href: "/dashboard", action: "Về Tổng quan" };
  }
  if (/khoa hoc|ghi danh|hoc|course|bai giang|video|tiep tuc/.test(q)) {
    if (teacher) return { text: "Mở Khóa học → Tạo khóa học mới → thêm bài học (video, bài đọc hoặc bài tập) → công bố. Chọn từng bài để tạo quiz, tự luận và bài dự án. Bạn chỉ quản lý được khóa học thuộc quyền mình.", href: "/learn", action: "Quản lý khóa học" };
    return { text: "Mở Khóa học để tìm hoặc lọc khóa. Chọn khóa muốn học → Ghi danh → Bắt đầu/tiếp tục học. Mỗi bài có video/tài liệu, bài luyện tập, nút chuyển bài và lưu tiến độ.", href: "/learn", action: "Khám phá khóa học" };
  }
  if (/thong bao|notification|deadline|han nop/.test(q)) {
    return { text: "Mở Thông báo để xem lời nhắc và phản hồi gần đây. Hạn nộp của quiz/bài tập được hiển thị trong mục Luyện tập của từng bài học.", href: "/notifications", action: "Mở thông báo" };
  }
  if (/chao|hello|hi |xin chao|bat dau|help|tro giup|huong dan/.test(q)) {
    return { text: "Mình là chatbot hướng dẫn UII. Bạn có thể hỏi về ghi danh, học bài, quiz, nộp minh chứng, nhóm dự án và xem phản hồi. Mình sẽ chỉ đường tới đúng chức năng bạn được phép sử dụng.", href: path.startsWith("/learn") ? "/learn" : "/dashboard", action: "Tiếp tục" };
  }
  return { text: "Mình chưa hiểu chính xác câu hỏi này. Thử hỏi: “Làm quiz ở đâu?”, “Nộp bài thế nào?”, “Tạo khóa học” hoặc “Xem phản hồi”. Đây là chatbot hướng dẫn theo kịch bản, không phải trợ lý AI tạo sinh nên mình sẽ không tự suy đoán thông tin.", href: role === "LECTURER" || role === "ADMIN" ? "/learn" : "/dashboard", action: "Mở trang hướng dẫn liên quan" };
}

export function WorkspaceChatbot({ role, pathname = "/dashboard" }: {role?: WorkspaceRole; pathname?: string}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: "bot", text: "Xin chào! Mình có thể hướng dẫn bạn sử dụng UII. Bạn muốn làm gì hôm nay?" },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
  useEffect(() => {
    if (open) transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
  }, [messages, open]);
  function send(text: string) {
    const trimmed = text.trim().slice(0, 350);
    if (!trimmed) return;
    const answer = respondToGuide(trimmed, role, pathname);
    const id = Date.now();
    setMessages(current => [...current.slice(-19), { id, from: "user", text: trimmed }, { id: id + 1, from: "bot", ...answer }]);
    setQuestion("");
    inputRef.current?.focus();
  }
  const suggestions = roleQuestions[role ?? "GUEST"];
  return <>
    <button type="button" aria-label={open ? "Đóng chatbot hướng dẫn" : "Mở chatbot hướng dẫn UII"}
      aria-expanded={open} aria-controls="uii-guide-chat" onClick={() => setOpen(value => !value)}
      className="fixed bottom-5 right-4 z-50 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#123c75] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(8,29,68,0.28)] transition hover:bg-[#0c2c54] focus-visible:outline-4 focus-visible:outline-orange-500">
      {open ? <X size={20} aria-hidden="true"/> : <MessageCircle size={20} aria-hidden="true"/>}
      {open ? "Đóng" : "Hỏi UII"}
    </button>
    {open && <section id="uii-guide-chat" role="dialog" aria-label="Chatbot hướng dẫn sử dụng UII"
      className="fixed bottom-[82px] right-4 z-50 flex max-h-[min(72dvh,610px)] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_60px_rgba(8,29,68,0.24)]">
      <header className="flex items-center gap-3 bg-[#071d43] px-4 py-4 text-white">
        <span className="grid size-10 place-items-center rounded-xl bg-white/15"><Bot size={22} aria-hidden="true"/></span>
        <div className="flex-1"><h2 className="font-extrabold">UII · Trợ lý hướng dẫn</h2>
          <p className="mt-0.5 text-xs text-slate-200">Hỗ trợ sử dụng nền tảng theo vai trò</p></div>
        <button type="button" className="grid size-10 place-items-center rounded-lg hover:bg-white/10"
          aria-label="Đóng cửa sổ chatbot" onClick={() => setOpen(false)}><X size={18}/></button>
      </header>
      <div ref={transcriptRef} role="log" aria-live="polite" aria-relevant="additions" aria-label="Lịch sử trò chuyện"
        className="min-h-[130px] flex-1 space-y-3 overflow-y-auto bg-[#f7f9fd] p-4">
        {messages.map(message => <div key={message.id}
          className={"max-w-[92%] rounded-2xl p-3 text-sm leading-6 " +
            (message.from === "bot" ? "mr-auto border bg-white text-slate-800" : "ml-auto bg-[#153b77] text-white")}>
          <p className="whitespace-pre-wrap">{message.text}</p>
          {message.href && <Link href={message.href} onClick={() => setOpen(false)}
            className="mt-2 inline-flex min-h-10 items-center font-bold text-[#153b77] underline">{message.action ?? "Mở trang"}</Link>}
        </div>)}
      </div>
      <div className="border-t bg-white p-3">
        <p className="mb-2 text-xs font-semibold text-slate-600">Bạn có thể hỏi</p>
        <div className="mb-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto">
          {suggestions.map(text => <button key={text} type="button" onClick={() => send(text)}
            className="min-h-9 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-[#153b77] hover:bg-blue-50">{text}</button>)}
        </div>
        <form onSubmit={(event: FormEvent<HTMLFormElement>) => {event.preventDefault();send(question);}}
          className="flex items-center gap-2">
          <label className="sr-only" htmlFor="uii-chat-question">Nhập câu hỏi cho chatbot</label>
          <input ref={inputRef} id="uii-chat-question" maxLength={350} value={question} onChange={event => setQuestion(event.target.value)}
            placeholder="Bạn cần hướng dẫn điều gì?" className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-base"/>
          <button type="submit" aria-label="Gửi câu hỏi" disabled={!question.trim()}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#153b77] text-white disabled:opacity-40"><Send size={18}/></button>
        </form>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">Chatbot kịch bản, không dùng AI tạo sinh. Không nhập mật khẩu hay dữ liệu cá nhân nhạy cảm.</p>
      </div>
    </section>}
  </>;
}
