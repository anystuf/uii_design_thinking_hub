"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Bell, FilePenLine, BookOpen, ClipboardCheck, FileText, FolderKanban, LayoutDashboard, LogOut, House, Users, MessagesSquare } from "lucide-react";
import { WorkspaceGuide, type WorkspaceRole } from "./workspace-guide";
import { warmWorkspaceApi } from "@/lib/authenticated-api";

const links = [
  { href: "/", label: "Home", icon: House },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classroom", label: "Classroom", icon: ClipboardCheck },
  { href: "/learn", label: "Courses", icon: BookOpen },
  { href: "/studio", label: "Projects", icon: FolderKanban },
  { href: "/community", label: "Community", icon: MessagesSquare },
  { href: "/evidence", label: "Evidence & Feedback", icon: FileText },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function WorkspaceNav({ title, role, onSignOut, guest = false, variant = "default" }: {
  title: string; role?: WorkspaceRole; onSignOut?: () => void; guest?: boolean; variant?: "default" | "classic";
}) {
  const pathname = usePathname();
  const classic = variant === "classic" && !guest;
  useEffect(() => { warmWorkspaceApi(); }, []);
  const navigation = [...links];
  if (role === "LECTURER" || role === "ADMIN") navigation.push({ href: "/console", label: "Course Console", icon: FilePenLine });
  if (role === "LECTURER" || role === "ADMIN") navigation.push({ href: "/review", label: "Submission Review", icon: ClipboardCheck });
  if (role === "ADMIN") navigation.push({ href: "/admin", label: "Administration", icon: Users });
  // Student research: keep the core learning flow visible; the rest remains discoverable.
  const coreHrefs = new Set(["/dashboard", "/classroom", "/learn", "/studio", "/evidence"]);
  const coreNavigation = navigation.filter(link => coreHrefs.has(link.href));
  const moreNavigation = navigation.filter(link => !coreHrefs.has(link.href));
  const studentNavigation = (mobile: boolean) => (
    <>
      <p className="px-3 pt-2 text-[11px] font-extrabold uppercase tracking-widest text-[#647579]">Start here</p>
      {coreNavigation.map(({ href, label, icon: Icon }) => <NavLink key={href} href={href} label={label} icon={Icon} active={pathname === href} classic={classic}/>)}
      <details key={mobile ? "mobile-extra-" + pathname : "desktop-extra-" + pathname}
        open={moreNavigation.some(link => link.href === pathname)}
        className="rounded-xl border-t border-[#e2e7de] pt-2">
        <summary className="min-h-11 cursor-pointer rounded-xl px-3 py-3 text-sm font-semibold text-[#344e57] hover:bg-[#e5eee8]">More tools</summary>
        <div className="mt-1 space-y-1 pl-1">
          {moreNavigation.map(({ href, label, icon: Icon }) => <NavLink key={href} href={href} label={label} icon={Icon} active={pathname === href} classic={classic}/>)}
        </div>
      </details>
    </>
  );

  return (
    <>
    <header className={guest ? "border-b border-[#d9e1db] bg-[#faf8f1]" : "workspace-header border-b lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-60 lg:overflow-y-auto lg:border-r " + (classic ? "border-[#d7dfda] bg-[#faf8f1] text-[#14313d]" : "border-[#d7dfda] bg-[#faf8f1] text-[#14313d]")}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:block focus:p-3">Skip to main content</a>
      <div className={guest ? "mx-auto max-w-6xl px-4 sm:px-6" : "px-4"}>
        <div className="flex min-h-16 items-center justify-between gap-2">
          <Link href="/" title="Go to Home" className="flex min-h-11 min-w-0 items-center gap-2.5">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#173445] text-[11px] font-black text-white">UII</span>
            <span className={"text-sm font-semibold leading-tight " + "text-[#14313d]"}>Design Thinking Hub</span>
          </Link>
          {guest && <WorkspaceGuide />}
          {!guest && (
            <details key={pathname} className="relative lg:hidden">
              <summary className="flex min-h-11 cursor-pointer items-center rounded-md border border-slate-300 px-3 text-sm font-semibold">Menu</summary>
              <nav aria-label="Workspace navigation" className={"absolute right-0 z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border p-2 shadow-lg " + "border-[#d7dfda] bg-[#faf8f1]"}>
                {role === "STUDENT" ? studentNavigation(true) : navigation.map(({ href, label, icon: Icon }) => <NavLink key={href} href={href} label={label} icon={Icon} active={pathname === href} classic={classic}/>)}
              </nav>
            </details>
          )}
        </div>
        {!guest && <>
          <nav aria-label="Workspace navigation" className={"hidden flex-col gap-1 border-t py-3 lg:flex " + "border-[#e2e7de]"}>
            {role === "STUDENT" ? studentNavigation(false) : navigation.map(({ href, label, icon: Icon }) => <NavLink key={href} href={href} label={label} icon={Icon} active={pathname === href} classic={classic}/>)}
          </nav>
          <div className={"flex flex-wrap items-center justify-between gap-x-1 border-t py-1 lg:flex-col lg:items-stretch " + "border-[#e2e7de]"}>
            <p className={"text-sm font-semibold lg:sr-only " + "text-[#14313d]"}>{title}</p>
            <WorkspaceGuide key={role} role={role} triggerClassName="text-[#14313d] hover:bg-[#e5eee8]"/>
            {onSignOut && <button type="button" onClick={onSignOut} className={"flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold " + "text-[#14313d] hover:bg-[#e5eee8]"}><LogOut size={17} aria-hidden="true"/> Sign out</button>}
          </div>
        </>}
      </div>
    </header>
    </>
  );
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof BookOpen; active: boolean; classic: boolean }) {
  return <Link href={href} aria-current={active ? "page" : undefined}
    className={"flex min-h-11 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold transition " +
    (active ? "bg-[#c8ecf0] text-[#173445]" : "text-[#344e57] hover:bg-[#e5eee8] hover:text-[#173445]")}>
    <Icon size={18} aria-hidden="true" className="shrink-0"/>{label}
  </Link>;
}
