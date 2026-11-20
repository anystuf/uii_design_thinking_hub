"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AuthTimeoutError, withAuthDeadline } from "@/lib/auth-timeout";

const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN === "true";
const field = "mt-1.5 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-base text-slate-950";

export function LearningAuthForm() {
  const [signUp, setSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState("");
  const [confirmationError, setConfirmationError] = useState(false);
  const [message, setMessage] = useState("");
  const confirmInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.has("error") || new URLSearchParams(window.location.search).has("error")) {
      setError("Không thể hoàn tất đăng nhập. Hãy thử lại hoặc đăng nhập bằng email.");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || timedOut) return;
    setError("");
    setMessage("");
    if (signUp && password !== confirmation) {
      setConfirmationError(true);
      confirmInput.current?.focus();
      return;
    }
    setConfirmationError(false);
    setPending("email");
    try {
      const auth = getSupabaseBrowserClient().auth;
      if (signUp) {
        const result = await withAuthDeadline(() => auth.signUp({
          email: email.trim(), password, options: { emailRedirectTo: window.location.origin + window.location.pathname },
        }));
        if (result.error) throw result.error;
        if (!result.data.session) setMessage("Kiểm tra hộp thư để xác nhận tài khoản, rồi quay lại đăng nhập.");
        setPassword("");
        setConfirmation("");
      } else {
        const result = await withAuthDeadline(() => auth.signInWithPassword({ email: email.trim(), password }));
        if (result.error) throw result.error;
      }
    } catch (err) {
      if (err instanceof AuthTimeoutError || (err instanceof Error && err.message.includes("Đăng nhập chưa được xác nhận"))) {
        setTimedOut(true);
        setError("Chưa nhận được kết quả xác thực. Tải lại trang để kiểm tra. Nếu vừa đăng ký, hãy kiểm tra hộp thư.");
      } else {
        const code = err && typeof err === "object" && "code" in err ? err.code : null;
        setError(code === "invalid_credentials" ? "Email hoặc mật khẩu không đúng."
          : code === "email_not_confirmed" ? "Bạn cần xác nhận địa chỉ email trước khi đăng nhập."
          : code === "weak_password" ? "Mật khẩu chưa đáp ứng yêu cầu. Hãy chọn mật khẩu mạnh hơn."
          : "Không thể hoàn tất yêu cầu. Kiểm tra thông tin và thử lại.");
      }
    } finally { setPending(null); }
  }

  async function google() {
    if (pending || timedOut || !googleEnabled) return;
    setError("");
    setPending("google");
    try {
      const result = await withAuthDeadline(() => getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + window.location.pathname },
      }));
      if (result.error || !result.data.url) throw new Error("Google sign-in unavailable");
    } catch {
      setPending(null);
      setError("Không thể mở Google. Hãy thử lại hoặc đăng nhập bằng email.");
    }
  }

  return (
    <section aria-labelledby="learning-auth-title" className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
      <h1 id="learning-auth-title" className="text-2xl font-semibold tracking-tight">{signUp ? "Tạo tài khoản" : "Đăng nhập"}</h1>
      <p className="mt-2 text-sm text-slate-600">{signUp ? "Dùng email bạn có thể truy cập để xác nhận tài khoản." : "Mở khóa học, tiến độ và dự án của bạn."}</p>
      {googleEnabled && (
        <div className="mt-5">
          <button type="button" disabled={!!pending || timedOut} onClick={() => void google()}
            className="min-h-11 w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">
            {pending === "google" ? "Đang mở Google…" : "Tiếp tục với Google"}
          </button>
          <div className="my-4 flex items-center gap-3 text-xs text-slate-600 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">Hoặc dùng email</div>
        </div>
      )}
      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-900">{message}</p>}
      <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4">
        <div>
          <label htmlFor="auth-email" className="text-sm font-semibold">Email</label>
          <input id="auth-email" autoComplete="email" required type="email" value={email} onChange={event => setEmail(event.target.value)} className={field}/>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="auth-password" className="text-sm font-semibold">Mật khẩu</label>
            <button type="button" onClick={() => setVisible(value => !value)} aria-controls={signUp ? "auth-password auth-confirmation" : "auth-password"} className="min-h-11 px-2 text-sm font-semibold text-[#153b77]">{visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</button>
          </div>
          <input id="auth-password" autoComplete={signUp ? "new-password" : "current-password"} required minLength={signUp ? 8 : undefined}
            type={visible ? "text" : "password"} value={password} onChange={event => { setPassword(event.target.value); setConfirmationError(false); }}
            aria-describedby={signUp ? "auth-password-hint" : undefined} className={field}/>
          {signUp && <p id="auth-password-hint" className="mt-1 text-sm text-slate-600">Dùng ít nhất 8 ký tự.</p>}
        </div>
        {signUp && <div>
          <label htmlFor="auth-confirmation" className="text-sm font-semibold">Xác nhận mật khẩu</label>
          <input ref={confirmInput} id="auth-confirmation" required autoComplete="new-password" type={visible ? "text" : "password"} value={confirmation}
            aria-invalid={confirmationError || undefined} aria-describedby={confirmationError ? "auth-confirmation-error" : undefined}
            onChange={event => { setConfirmation(event.target.value); setConfirmationError(false); }} className={field}/>
          {confirmationError && <p id="auth-confirmation-error" role="alert" className="mt-1 text-sm text-red-800">Hai mật khẩu chưa khớp.</p>}
        </div>}
        <button disabled={!!pending || timedOut} className="min-h-11 w-full rounded-md bg-[#173762] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending === "email" ? "Đang xác thực tài khoản…" : signUp ? "Đăng ký" : "Đăng nhập"}
        </button>
        {timedOut && <button type="button" onClick={() => window.location.reload()} className="min-h-11 w-full rounded-md border px-4 py-2 text-sm font-semibold">Tải lại trang</button>}
      </form>
      <button type="button" disabled={!!pending || timedOut} className="mt-2 min-h-11 text-left text-sm font-semibold text-[#153b77] underline" onClick={() => {
        setSignUp(value => !value); setPassword(""); setConfirmation(""); setError(""); setMessage(""); setConfirmationError(false); setVisible(false);
      }}>{signUp ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}</button>
    </section>
  );
}
