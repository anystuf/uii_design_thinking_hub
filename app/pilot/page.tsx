import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ClipboardCheck, FileCheck2, LockKeyhole, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Hướng dẫn thử nghiệm lớp học | UII Design Thinking Hub",
  description: "Hướng dẫn pilot Activity 2 — First Findings cho sinh viên và giảng viên, kèm mẫu góp ý UX.",
};

const studentSteps = [
  { title: "Mở lớp học của bạn", body: "Chọn Buổi học, kiểm tra xem nhiệm vụ hiện tại có rõ ràng không. Nếu chưa có tài khoản thử nghiệm được cấp, hãy dùng nút Thử giao diện demo, không tự nhập dữ liệu lớp thật.", href: "/classroom", label: "Vào Buổi học" },
  { title: "Chọn đúng nhóm và mở Activity 2", body: "Chỉ dùng nhóm thử nghiệm mà giảng viên đã xác nhận. Không tự tạo nhóm chứa dữ liệu của sinh viên thật.", href: "/classroom/first-findings", label: "Mở Activity 2" },
  { title: "Khám phá HAI vấn đề", body: "Với mỗi vấn đề, mô tả: vấn đề, nguồn kiểm chứng, đối tượng chịu ảnh hưởng, cách họ đang ứng phó, nguồn lực họ dùng và lý do vấn đề đáng giải quyết. Ghi thêm giới hạn của nhóm: người, thời gian, thiết bị.", href: null, label: null },
  { title: "Lưu minh chứng rồi kiểm tra lại", body: "Chọn Lưu minh chứng Activity 2, chờ thông báo xác minh từ máy chủ. Tải lại trang để chắc chắn dữ liệu còn. Lưu minh chứng KHÔNG có nghĩa là đã nộp bài.", href: null, label: null },
  { title: "Đính kèm một slide và nộp bài", body: "Chỉ sau khi giảng viên xác nhận kiểm thử ghi dữ liệu được phép: vào Minh chứng, đính kèm một slide tổng hợp dạng PDF/ảnh hoặc link giảng viên mở được, chọn đúng phiên bản minh chứng và tạo snapshot nộp bài.", href: "/evidence", label: "Đến Minh chứng" },
  { title: "Xem phản hồi và cải tiến", body: "Chờ giảng viên yêu cầu chỉnh sửa; tạo phiên bản mới và nộp lại. Kiểm tra xem bản đã nộp trước đó có được giữ nguyên không.", href: "/notifications", label: "Xem thông báo" },
] as const;

const teacherSteps = [
  { title: "Chọn hai nhóm thử nghiệm riêng biệt", body: "Dùng tối thiểu hai tài khoản sinh viên thử nghiệm với quyền truy cập khác nhau; không sử dụng danh sách 50 sinh viên để import hàng loạt." },
  { title: "Chuẩn bị bài và quyền nhóm", body: "Kiểm tra Course/Challenge đã công bố, hai nhóm được gán đúng và Activity 2 được mở trên bảng Buổi học." },
  { title: "Kiểm tra bản nộp", body: "Vào Đánh giá bài nộp để xem snapshot đã nộp. Chỉ chấm một bản thực sự có trạng thái SUBMITTED, không xem trạng thái 'đã lưu minh chứng' là đã nộp." },
  { title: "Phản hồi và kiểm tra chỉnh sửa", body: "Gửi yêu cầu chỉnh sửa bằng nhận xét cụ thể, sau đó mở bản nộp mới để xác nhận phiên bản cũ không bị ghi đè." },
  { title: "Thử bảo mật hai nhóm", body: "Kiểm tra tài khoản nhóm B không thể xem hoặc sửa dữ liệu riêng tư của nhóm A. Dừng kiểm thử nếu có thể đọc chéo dữ liệu." },
] as const;

const feedbackQuestions = [
  "1. Khi mở trang, bạn có biết cần làm gì tiếp theo trong 10 giây không? (Có / Không)",
  "2. Bạn bị vướng ở bước nào? (Đăng nhập / Chọn nhóm / Làm bài / Lưu / Nộp / Xem phản hồi / Khác)",
  "3. Sau khi tải lại, nội dung đã lưu có còn nguyên không? (Có / Không / Chưa thử)",
  "4. Điều gì làm bạn phân tâm hoặc cảm thấy quá nhiều thông tin?",
  "5. Một thay đổi quan trọng nhất bạn muốn nhóm phát triển thực hiện là gì?",
  "Thiết bị/trình duyệt: ... | Ảnh lỗi đã che thông tin cá nhân (nếu có): ...",
];

function SectionHeading({ number, title, description }: {number: string; title: string; description: string}) {
  return <div className="mb-5"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#9b512c]">{number}</p><h2 className="mt-2 text-xl font-black tracking-tight text-[#173445] sm:text-2xl">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-[#52656b]">{description}</p></div>;
}

export default function ClassroomPilotPage() {
  return <main id="main-content" className="min-h-screen bg-[#faf8f1] px-4 py-8 text-[#173445] sm:px-6 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center gap-3 font-black"><span className="grid size-10 place-items-center rounded-xl bg-[#173445] text-sm text-white">UII</span> Design Thinking Hub</Link>
        <span className="rounded-full border border-[#cbdad0] bg-white px-4 py-2 text-xs font-bold text-[#52656b]">PILOT · Activity 2 / First Findings</span>
      </header>
      <section aria-labelledby="pilot-title" className="mt-8 overflow-hidden rounded-[28px] bg-[#173445] p-6 text-white sm:p-9">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#bfe7d9]">Hướng dẫn dành cho giảng viên & nhóm sinh viên thử nghiệm</p>
        <h1 id="pilot-title" className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">Một nhiệm vụ rõ ràng. Một vòng học tập trọn vẹn.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#e0efec]">Kiểm tra việc tìm nhiệm vụ, thực hành, lưu minh chứng, nộp bài, nhận phản hồi và chỉnh sửa. Đây là đợt thử nghiệm giới hạn, không phải hệ thống nộp bài chính thức cho cả lớp.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/demo" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#f9d29f] px-5 py-3 text-sm font-black text-[#173445] hover:bg-white">Thử giao diện không cần đăng nhập <ArrowRight size={17}/></Link>
          <Link href="/learn" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Đăng nhập tài khoản thử nghiệm <ArrowRight size={17}/></Link>
        </div>
      </section>

      <div role="note" className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300 bg-[#fff7e9] p-4 text-sm leading-6 text-[#754321]">
        <LockKeyhole className="mt-0.5 shrink-0" size={20}/><div><strong>Quan trọng trước khi thử nộp thật:</strong> Giảng viên và người quản trị cần xác nhận tài khoản thử nghiệm, môi trường đăng nhập, phân quyền, sao lưu và backend trước khi cho phép ghi dữ liệu. Nếu chưa được xác nhận, chỉ thử demo và gửi nhận xét UX. Không nhập dữ liệu nhận diện người phỏng vấn, mật khẩu hay thông tin sinh viên thật.</div>
      </div>

      <section className="mt-10 rounded-[24px] border border-[#e0e7df] bg-white p-5 sm:p-8" aria-label="Hướng dẫn sinh viên thử nghiệm">
        <SectionHeading number="01 · SINH VIÊN" title="Các bạn thử theo sáu bước" description="Mỗi nhóm làm độc lập trên thiết bị của mình. Một nhóm ưu tiên máy tính, nhóm còn lại có thể kiểm tra trên điện thoại."/>
        <ol className="space-y-5">
          {studentSteps.map((step,i)=><li key={step.title} className="flex gap-4 border-b border-[#edf0eb] pb-5 last:border-0 last:pb-0">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dceee6] text-sm font-black">{i+1}</span>
            <div className="min-w-0 flex-1"><h3 className="font-extrabold">{step.title}</h3><p className="mt-1 text-sm leading-7 text-[#52656b]">{step.body}</p>{step.href && <Link href={step.href} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-[#0f6754] underline underline-offset-4">{step.label}<ArrowRight size={16}/></Link>}</div>
          </li>)}
        </ol>
      </section>

      <section className="mt-6 rounded-[24px] border border-[#e0e7df] bg-white p-5 sm:p-8" aria-label="Hướng dẫn giảng viên thử nghiệm">
        <SectionHeading number="02 · GIẢNG VIÊN" title="Kiểm tra vòng phản hồi của nhóm" description="Cần một giảng viên có tài khoản Lecturer được cấp quyền hợp lệ và hai nhóm thử nghiệm đã được tạo trên backend."/>
        <ol className="space-y-4">{teacherSteps.map((step,i)=><li key={step.title} className="flex gap-3 text-sm leading-7"><span className="font-black text-[#0f6754]">{i+1}.</span><div><strong>{step.title}.</strong> <span className="text-[#52656b]">{step.body}</span></div></li>)}</ol>
        <div className="mt-5 flex flex-wrap gap-3"><Link href="/classroom" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173445] px-4 py-3 text-sm font-bold text-white"><Users size={18}/> Bảng Buổi học</Link><Link href="/review" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#9bbaae] px-4 py-3 text-sm font-bold text-[#173445]"><FileCheck2 size={18}/> Đánh giá bài nộp</Link></div>
        <p className="mt-4 text-xs leading-6 text-[#647579]">Rubric dự án theo runbook: Vấn đề 30%, Giải pháp 30%, Sáng tạo 15%, Trình bày 10%, Hỏi đáp 15%. Điểm học phần là hệ thống đánh giá khác.</p>
      </section>

      <section className="mt-6 rounded-[24px] border border-[#e0e7df] bg-white p-5 sm:p-8">
        <SectionHeading number="03 · PHẢN HỒI UX" title="Năm câu hỏi để gửi sau khi thử" description="Các bạn có thể sao chép các câu dưới đây và trả lời trong tin nhắn gửi trực tiếp cho giảng viên hoặc nhóm phát triển. Không cần đăng nhập vào một biểu mẫu mới."/>
        <div className="rounded-2xl bg-[#f1f6f2] p-4 sm:p-5"><ol className="space-y-3 text-sm leading-7">{feedbackQuestions.map(q=><li key={q}>{q}</li>)}</ol></div>
        <p className="mt-4 text-sm leading-6 text-[#52656b]">Nếu gặp lỗi, ghi rõ đường dẫn, thao tác trước khi lỗi xảy ra, thông báo hiển thị và loại thiết bị. Chỉ chia sẻ ảnh chụp đã che email, tên người thật, thông tin nhóm riêng tư và các mã đăng nhập.</p>
      </section>

      <section className="mt-6 rounded-[24px] border border-[#d8e6dc] bg-[#eaf4eb] p-5 sm:p-7">
        <h2 className="flex items-center gap-2 text-lg font-black"><ShieldCheck size={21}/> Khi nào vòng thử được xem là đạt?</h2>
        <p className="mt-3 text-sm leading-7 text-[#3d5d54]">Sinh viên tự tìm đúng nhiệm vụ, lưu xong còn dữ liệu sau tải lại, có trạng thái đã nộp thật, giảng viên xem được bài và phản hồi, nhóm chỉnh sửa được phiên bản mới. Nhóm ngoài không xem được dữ liệu riêng tư. Nếu một bước quan trọng bị lỗi, ghi nhận "Chưa đạt" thay vì đánh dấu hoàn thành giả.</p>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-[#647579]">
        <span>UII Design Thinking Hub · Hướng dẫn pilot, không chứa danh sách sinh viên</span>
        <Link href="/classroom" className="inline-flex min-h-11 items-center gap-2 font-bold text-[#173445]"><ClipboardCheck size={16}/> Về Buổi học <ArrowRight size={16}/></Link>
      </footer>
    </div>
  </main>;
}
