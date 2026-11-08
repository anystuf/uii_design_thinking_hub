const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const REQUEST_TIMEOUT_MS = 25000;
// Render Free web services spin down after inactivity and can take about a minute to wake.
const PROFILE_WAKE_TIMEOUT_MS = 75000;

/** A bounded request; successful Supabase sign-in alone does not verify an app role. */
export async function authenticatedApi<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const isProfileLookup = path === '/auth/me';
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
      const requestId = response.headers.get('X-Request-Id');
      // Do not surface raw upstream errors that could contain personal data or connection details.
      throw new Error(`HTTP ${response.status}${requestId ? ` · Request ${requestId}` : ''}. Không tải được dữ liệu. Hãy thử lại.`);
    }
    return await response.json() as T;
  } catch (error) {
    if (controller.signal.aborted && !init?.signal?.aborted) {
      throw new Error(isProfileLookup
        ? 'API chưa khởi động sau 75 giây. Hồ sơ chưa được xác minh; hãy thử tải lại.'
        : 'API chưa phản hồi trong 25 giây. Hồ sơ chưa được xác minh. Hãy thử tải lại.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    init?.signal?.removeEventListener('abort', cancel);
  }
}
