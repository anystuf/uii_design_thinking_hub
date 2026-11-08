const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** A bounded request; successful Supabase sign-in alone does not verify an app role. */
export async function authenticatedApi<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  init?.signal?.addEventListener('abort', cancel, { once: true });
  if (init?.signal?.aborted) cancel();
  const timer = setTimeout(cancel, 25000);
  const headers = new Headers(init?.headers);
  headers.set('Authorization', 'Bearer ' + token);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    const response = await fetch(API_URL + path, { ...init, headers, cache: 'no-store', signal: controller.signal });
    if (!response.ok) {
      const requestId = response.headers.get('X-Request-Id');
      // Do not surface raw upstream errors that could contain personal data or connection details.
      throw new Error(`HTTP ${response.status}${requestId ? ` · Request ${requestId}` : ''}. Không tải được dữ liệu. Hãy thử lại.`);
    }
    return await response.json() as T;
  } catch (error) {
    if (controller.signal.aborted && !init?.signal?.aborted) {
      throw new Error('API chưa phản hồi trong 25 giây. Hồ sơ chưa được xác minh. Hãy thử tải lại.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    init?.signal?.removeEventListener('abort', cancel);
  }
}
