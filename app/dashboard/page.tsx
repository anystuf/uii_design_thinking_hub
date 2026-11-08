import type { Metadata } from 'next';
import { LiveHubDashboard } from '@/components/live-hub-dashboard';

export const metadata: Metadata = {
  title: 'Learning Dashboard | UII Design Thinking Hub',
  description: 'Không gian học tập theo vai trò, dữ liệu thực, tiến độ, dự án, phản hồi và thông báo.',
};

export default function DashboardPage() {
  return <LiveHubDashboard />;
}
