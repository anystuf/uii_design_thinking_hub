import type { Metadata } from "next";
import { Suspense } from "react";
import { DemoPlayground } from "@/components/demo-playground";

export const metadata: Metadata = {
  title: "Thử bài học Design Thinking | UII Demo",
  description: "Demo công khai: 6 khóa học, 36 bài học và 36 nhiệm vụ luyện tập. Không cần đăng nhập; không lưu kết quả LMS.",
};

export default function DemoPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#fbf8f1] p-8 text-[#163744]">Đang mở không gian học thử…</main>}>
    <DemoPlayground />
  </Suspense>;
}
