import { getSupabaseBrowserClient } from './supabase-browser';

export type CommunityPost = {
  id: string;
  caption?: string | null;
  project: { id: string; title: string; description?: string | null; currentStage: string; course: { title: string } };
  author: { id: string; fullName: string; role: string };
  _count: { comments: number; reactions: number };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Uses a Supabase access token. Never sends spoofable user/role headers. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: { session }, error } = await getSupabaseBrowserClient().auth.getSession();
  if (error || !session) throw new Error('Please sign in to access your learning data.');

  const headers = new Headers(init?.headers);
  headers.set('Authorization', 'Bearer ' + session.access_token);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(API_URL + path, { ...init, headers });
  if (!response.ok) {
    throw new Error('API ' + response.status + ': ' + (await response.text()).slice(0, 200));
  }
  return response.json() as Promise<T>;
}

export function getCommunityFeed() {
  return request<CommunityPost[]>('/community/feed');
}

export function saveLessonProgress(lessonId: string, completed: boolean) {
  return request('/lessons/' + encodeURIComponent(lessonId) + '/progress', {
    method: 'PUT',
    body: JSON.stringify({ completed }),
  });
}
