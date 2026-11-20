const upstreamUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
// Preview hostnames are ephemeral. Make browser API calls on the same origin
// and let the Next.js /backend rewrite forward to the configured Render API.
// Keep direct API calls in local tests and on GitHub Pages static export.
const useSameOriginProxy = typeof window !== 'undefined' &&
  (window.location.hostname.endsWith('.vercel.app') ||
   process.env.NEXT_PUBLIC_API_PROXY === 'true');
const API_URL = useSameOriginProxy ? '/backend' : upstreamUrl;
const REQUEST_TIMEOUT_MS = 25000;
// Render Free web services spin down after inactivity and can take about a minute to wake.
const PROFILE_WAKE_TIMEOUT_MS = 75000;
let lastWarmup = 0;
let profile: { token: string; expiresAt: number; request: Promise<unknown> } | undefined;

/** Start the staging service while the user enters credentials. */
export function warmWorkspaceApi() {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_API_URL ||
      Date.now() - lastWarmup < 60000) return;
  lastWarmup = Date.now();
  void fetch(API_URL + '/health', { cache: 'no-store', signal: AbortSignal.timeout(PROFILE_WAKE_TIMEOUT_MS) })
    .then(response => response.body?.cancel())
    .catch(() => {});
}

export function clearWorkspaceProfile() {
  profile = undefined;
}

/** The API remains responsible for authorizing each data request. */
export function workspaceProfile<T>(token: string, refresh = false): Promise<T> {
  if (!refresh && profile?.token === token && profile.expiresAt > Date.now()) {
    return profile.request as Promise<T>;
  }
  const entry = {
    token,
    expiresAt: Infinity,
    request: authenticatedApi<T>('/auth/me', token),
  };
  profile = entry;
  void entry.request.then(
    () => { entry.expiresAt = Date.now() + 15000; },
    () => { if (profile === entry) clearWorkspaceProfile(); },
  );
  return entry.request;
}

export class WorkspaceApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

/** A bounded request; successful Supabase sign-in alone does not verify an app role. */
export async function authenticatedApi<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const isProfileLookup = path === '/auth/me' && (init?.method ?? 'GET').toUpperCase() === 'GET';
  const deadline = Date.now() + (isProfileLookup ? PROFILE_WAKE_TIMEOUT_MS : REQUEST_TIMEOUT_MS);
  const controller = new AbortController();
  const cancel = () => controller.abort();
  init?.signal?.addEventListener('abort', cancel, { once: true });
  if (init?.signal?.aborted) cancel();
  const timer = setTimeout(cancel, Math.max(1, deadline - Date.now()));
  const headers = new Headers(init?.headers);
  headers.set('Authorization', 'Bearer ' + token);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    let response: Response;
    let attempts = 0;
    do {
      response = await fetch(API_URL + path, { ...init, headers, cache: 'no-store', signal: controller.signal });
      const canRetryWake = isProfileLookup && [502, 503, 504].includes(response.status) && Date.now() + 5000 < deadline;
      if (!canRetryWake || attempts >= 12) break;
      attempts += 1;
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => { clearTimeout(delay); reject(new DOMException('Aborted', 'AbortError')); };
        const delay = setTimeout(() => { controller.signal.removeEventListener('abort', onAbort); resolve(); }, 5000);
        controller.signal.addEventListener('abort', onAbort, { once: true });
      });
    } while (Date.now() < deadline);
    if (!response.ok) {
      if (response.status === 401 && profile?.token === token) clearWorkspaceProfile();
      const requestId = response.headers.get('X-Request-Id');
      // Do not surface raw upstream errors that could contain personal data or connection details.
      throw new WorkspaceApiError(response.status, `Không tải được dữ liệu (HTTP ${response.status}). Hãy thử lại.${requestId ? ` Mã yêu cầu: ${requestId}` : ''}`);
    }
    return await response.json() as T;
  } catch (error) {
    if (controller.signal.aborted && !init?.signal?.aborted) {
      throw new Error(isProfileLookup
        ? 'Máy chủ chưa xác minh được tài khoản. Hãy thử lại.'
        : 'Máy chủ phản hồi chậm. Hãy thử lại.');
    }
    if (error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message)) {
      throw new Error('Không kết nối được API. Kiểm tra kết nối rồi chọn Thử lại; nếu vẫn lỗi, báo quản trị viên kiểm tra máy chủ.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    init?.signal?.removeEventListener('abort', cancel);
  }
}
