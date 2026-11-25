import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { WorkspaceChatbot } from '@/components/workspace-chatbot';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-sans-sharp', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'vietnamese'], variable: '--font-sans-ui', display: 'swap', preload: false });
const playfair = Playfair_Display({ subsets: ['latin', 'vietnamese'], variable: '--font-serif-display', display: 'swap', preload: false });

export const metadata: Metadata = {
  title: {
    default: 'UII Design Thinking Hub | From Ideas to Impact',
    template: '%s | UII Design Thinking Hub',
  },
  description: 'UII Design Thinking Hub brings learning, design thinking, innovation, and collaboration together through hands-on projects.',
  openGraph: {
    title: 'UII Design Thinking Hub — From Ideas to Impact',
    description: 'Learning · Innovation · Impact. Learn through challenges and improve with evidence.',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable} ${playfair.variable}`}>
        {children}
        <WorkspaceChatbot />
      </body>
    </html>
  );
}
