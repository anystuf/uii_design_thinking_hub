export class AuthTimeoutError extends Error {
  constructor() {
    super('Đăng nhập chưa được xác nhận vì dịch vụ xác thực phản hồi quá lâu. Hãy tải lại trang rồi thử lại; không cần chờ thêm.');
    this.name = 'AuthTimeoutError';
  }
}

/** Bounds SDK work too (initialization/subscriber waits can happen outside fetch). */
export async function withAuthDeadline<T>(operation: () => Promise<T>, timeoutMs = 20000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new AuthTimeoutError()), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Only Auth requests are bounded here; private evidence uploads retain their own policy. */
export function createBoundedAuthFetch(
  supabaseUrl: string,
  timeoutMs = 15000,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): typeof fetch {
  const origin = new URL(supabaseUrl).origin;
  return async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.origin !== origin || !url.pathname.startsWith('/auth/v1/')) {
      return fetchImpl(input, init);
    }
    const controller = new AbortController();
    const callerSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    const cancel = () => controller.abort();
    callerSignal?.addEventListener('abort', cancel, { once: true });
    if (callerSignal?.aborted) cancel();
    try {
      return await withAuthDeadline(async () => {
        const response = await fetchImpl(input, { ...init, signal: controller.signal });
        // Include body reads in the bound; receiving headers alone is not successful auth.
        const body = await response.arrayBuffer();
        return new Response(response.status === 204 || response.status === 205 || response.status === 304 ? null : body, {
          status: response.status, statusText: response.statusText, headers: response.headers,
        });
      }, timeoutMs);
    } finally {
      controller.abort();
      callerSignal?.removeEventListener('abort', cancel);
    }
  };
}
