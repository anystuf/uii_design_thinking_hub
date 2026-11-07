import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "USI Design Thinking Hub | Learn, Build, Improve",
  description:
    "Nền tảng học tập theo dự án và Design Thinking: khóa học, challenge, nhóm, minh chứng, phiên bản bài nộp và phản hồi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
