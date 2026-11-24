const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com']);

export function getYouTubeEmbedUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !YOUTUBE_HOSTS.has(url.hostname)) return null;
    let id = '';
    if (url.hostname.endsWith('youtu.be')) id = url.pathname.split('/').filter(Boolean)[0] ?? '';
    else if (url.pathname === '/watch') id = url.searchParams.get('v') ?? '';
    else if (/^\/(embed|shorts)\//.test(url.pathname)) id = url.pathname.split('/')[2] ?? '';
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export function getSafeHttpUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export function getResourceLinks(content?: string | null): string[] {
  if (!content) return [];
  return [...new Set(content.match(/https?:\/\/[^\s<>()]+/g) ?? [])]
    .map((value) => getSafeHttpUrl(value.replace(/[.,;!?]+$/, '')))
    .filter((value): value is string => value !== null);
}

