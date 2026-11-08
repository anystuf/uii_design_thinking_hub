import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'UII Design Thinking Hub | From Ideas to Impact',
    template: '%s | UII Design Thinking Hub',
  },
  description: 'UII Design Thinking Hub kết nối đào tạo, Design Thinking, đổi mới sáng tạo, ươm tạo và hợp tác. Bắt đầu với Learning Hub và các dự án thực tế.',
  openGraph: {
    title: 'UII Design Thinking Hub — From Ideas to Impact',
    description: 'Learning · Innovation · Impact. Học qua thử thách và cải tiến dựa trên minh chứng.',
    type: 'website',
    locale: 'vi_VN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
