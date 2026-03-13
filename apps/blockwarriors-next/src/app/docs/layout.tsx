import { createPageMetadata } from '@/lib/metadata';
import { DocsLayoutClient } from './components/DocsLayoutClient';

export const metadata = createPageMetadata({
  title: 'Documentation',
  description:
    'Learn how to build AI bots for BlockWarriors — the Minecraft bot programming competition.',
  path: '/docs',
  keywords: [
    'documentation',
    'bot programming',
    'mineflayer',
    'SDK',
    'API reference',
  ],
});

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsLayoutClient>{children}</DocsLayoutClient>;
}
