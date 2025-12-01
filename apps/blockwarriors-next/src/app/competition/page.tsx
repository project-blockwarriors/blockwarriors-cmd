import CompetitionContent from './components/CompetitionContent';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Spring 2026 Championship',
  description:
    'Join the BlockWarriors Spring 2026 AI Minecraft Championship. Online qualifiers lead to 16-team in-person finals at Princeton University. Build intelligent bots, compete for prizes!',
  path: '/competition',
  ogImage: 'competition',
  keywords: [
    'BlockWarriors Spring 2026',
    'AI Minecraft championship',
    'Princeton tournament',
    'bot competition',
    'Mineflayer tournament',
    'AI programming contest',
    'game AI competition',
    'online qualifiers',
    'esports AI',
  ],
});

export default function CompetitionPage() {
  return <CompetitionContent />;
}
