import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UII Design Thinking Learning Hub & InnoGallery",
  description:
    "A premium academic LMS and peer critique gallery for design sprint learning.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

