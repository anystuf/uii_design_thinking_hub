"use client";

import { useEffect, useState } from "react";

export function WorkspaceLoading({ label }: {label: string}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 4500);
    return () => window.clearTimeout(timer);
  }, []);
  return <div role="status" className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
    <p className="font-semibold">{label}</p>
    {slow && <p className="mt-2 leading-6">Máy chủ đang phản hồi chậm. Trong lúc chờ, bạn có thể mở Trợ giúp để xem hướng dẫn.</p>}
  </div>;
}
