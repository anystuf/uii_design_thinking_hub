"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Bell, BookOpen, ClipboardCheck, FileText, FolderKanban, LayoutDashboard, LogOut, Users } from "lucide-react";
import { WorkspaceGuide, type WorkspaceRole } from "./workspace-guide";
import { WorkspaceChatbot } from "./workspace-chatbot";
import { warmWorkspaceApi } from "@/lib/authenticated-api";

const links = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/learn", label: "Khóa học", icon: BookOpen },
  { href: "/studio", label: "Dự án", icon: FolderKanban },
  { href: "/evidence", label: "Minh chứng & phản hồi", icon: FileText },
  { href: "/notifications", label: "Thông báo", icon: Bell },
];

export function WorkspaceNav({ title, role, onSignOut, guest = false, variant = "default" }: {
  title: string; role?: WorkspaceRole; onSignOut?: () => void; guest?: boolean; variant?: "default" | "classic";
}) {
  const pathname = usePathname();
  const classic = variant === "classic" && !guest;
  useEffect(() => { warmWorkspaceApi(); }, []);
  const navigation = [...links];
  if (role === "LECTURER" || role === "ADMIN") navigation.push({ href: "/review", label: "Đánh giá bài nộp", icon: ClipboardCheck });
  if (role === "ADMIN") navigation.push({ href: "/admin", label: "Quản trị", icon: Users });

  return (
    <header className={guest ? "border-b border-slate-200 bg-white" : "workspace-header border-b lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-60 lg:overflow-y-auto lg:border-r " + (classic ? "border-[#17345a] bg-[#071d43] text-white" : "border-slate-200 bg-white")}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:block focus:p-3">Đi đến nội dung chính</a>
      <div className={guest ? "mx-auto max-w-6xl px-4 sm:px-6" : "px-4"}>
        <div className="flex min-h-16 items-center justify-between gap-2">
          <Link href={guest ? "/" : "/dashboard"} className="flex min-h-11 min-w-0 items-center gap-2.5">
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded bg-[#173762] text-[10px] font-semibold text-white">UII</span>
            <span className={"text-sm font-semibold leading-tight " + (classic ? "text-white" : "text-[#12284a]")}>Design Thinking Hub</span>
          </Link>
          {guest && <WorkspaceGuide />}
          {!guest && (
            <details key={pathname} className="relative lg:hidden">
              <summary className="flex min-h-11 cursor-pointer items-center rounded-md border border-slate-300 px-3 text-sm font-semibold">Menu</summary>
              <nav aria-label="Điều hướng không gian học tập" className={"absolute right-0 z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border p-2 shadow-lg " + (classic ? "border-[#244568] bg-[#071d43]" : "bg-white")}>
                {navigation.map(({ href, label, icon: Icon }) => <NavLink key={href} href={href} label={label} icon={Icon} active={pathname === href} classic={classic}/>)}
              </nav>
            </details>
          )}
        </div>
        {!guest && <>
          <nav aria-label="Điều hướng không gian học tập" className={"hidden flex-col gap-1 border-t py-3 lg:flex " + (classic ? "border-white/15" : "border-slate-200")}>
            {navigation.map(({ href, label, icon: Icon }) => <NavLink key={href} href={href} label={label} icon={Icon} active={pathname === href} classic={classic}/>)}
          </nav>
          <div className={"flex flex-wrap items-center justify-between gap-x-1 border-t py-1 lg:flex-col lg:items-stretch " + (classic ? "border-white/15" : "border-slate-200")}>
            <p className={"text-sm font-semibold lg:sr-only " + (classic ? "text-white" : "text-slate-900")}>{title}</p>
            <WorkspaceGuide key={role} role={role} triggerClassName={classic ? "text-white hover:bg-white/10" : undefined}/>
            {onSignOut && <button type="button" onClick={onSignOut} className={"flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold " + (classic ? "text-slate-200 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100")}><LogOut size={17} aria-hidden="true"/> Đăng xuất</button>}
          </div>
        </>}
      </div>
      <WorkspaceChatbot role={role} pathname={pathname} />
    </header>
  );
}

function NavLink({ href, label, icon: Icon, active, classic }: { href: string; label: string; icon: typeof BookOpen; active: boolean; classic: boolean }) {
  return <Link href={href} aria-current={active ? "page" : undefined}
    className={"flex min-h-11 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium " + (classic ? active ? "bg-white/15 font-semibold text-white" : "text-slate-200 hover:bg-white/10 hover:text-white" : active ? "bg-blue-50 font-semibold text-[#153b77]" : "text-slate-700 hover:bg-slate-50")}>
    <Icon size={17} aria-hidden="true" className="shrink-0"/>{label}
  </Link>;
}
