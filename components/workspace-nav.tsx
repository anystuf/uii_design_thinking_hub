"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "STUDENT" | "LECTURER" | "ADMIN" | "MENTOR";

export function WorkspaceNav({
  title,
  role,
  onSignOut,
}: {
  title: string;
  role?: Role;
  onSignOut?: () => void;
}) {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard", label: "Tổng quan" },
    { href: "/learn", label: "Khóa học" },
    { href: "/studio", label: "Dự án" },
    { href: "/evidence", label: "Minh chứng & phản hồi" },
    { href: "/notifications", label: "Thông báo" },
  ];
  if (role === "LECTURER" || role === "ADMIN")
    links.push({ href: "/review", label: "Đánh giá bài nộp" });
  if (role === "ADMIN") links.push({ href: "/admin", label: "Quản trị" });
  const navigation = links.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      aria-current={pathname === link.href ? "page" : undefined}
      className={
        "flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold " +
        (pathname === link.href
          ? "bg-blue-50 text-[#153b77]"
          : "text-slate-600 hover:bg-slate-50")
      }
    >
      {link.label}
    </Link>
  ));
  return (
    <header className="workspace-header border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-60 lg:overflow-y-auto lg:border-r">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:block focus:p-3"
      >
        Đi đến nội dung chính
      </a>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="min-w-0">
            <p className="text-xs font-bold text-[#c64d08]">
              UII Design Thinking Hub
            </p>
            <h1 className="text-lg font-extrabold text-[#12284a]">{title}</h1>
          </Link>
          <details className="relative lg:hidden">
            <summary className="flex min-h-11 cursor-pointer items-center rounded-lg border px-4 text-sm font-bold">
              Menu
            </summary>
            <nav
              aria-label="Điều hướng không gian học tập"
              className="absolute right-0 z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border bg-white p-2 shadow-xl"
            >
              {navigation}
            </nav>
          </details>
        </div>
        <nav
          aria-label="Điều hướng không gian học tập"
          className="mt-6 hidden flex-col gap-2 lg:flex"
        >
          {navigation}
        </nav>
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="mt-2 min-h-11 rounded-lg border px-3 text-sm font-semibold"
          >
            Đăng xuất
          </button>
        )}
      </div>
    </header>
  );
}
