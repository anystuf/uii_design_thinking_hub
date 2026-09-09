export type CommunityPost = {
  id: string;
  caption?: string | null;
  project: { id: string; title: string; description?: string | null; currentStage: string; course: { title: string } };
  author: { id: string; fullName: string; role: string };
  _count: { comments: number; reactions: number };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const studentHeaders = {
  'Content-Type': 'application/json',
  'x-user-id': '22222222-2222-4222-8222-222222222222',
  'x-user-email': 'student@uii.edu.vn',
  'x-user-name': 'Minh Anh',
  'x-user-role': 'STUDENT',
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...studentHeaders, ...init?.headers },
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}

export function getCommunityFeed() {
  return request<CommunityPost[]>('/community/feed');
}

export function saveLessonProgress(lessonId: string, completed: boolean) {
  return request(`/lessons/${lessonId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ completed }),
  });
}
