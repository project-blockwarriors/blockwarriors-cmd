import CompetitionContent from './components/CompetitionContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spring 2026 Championship',
  description:
    'Join the BlockWarriors Spring 2026 AI Minecraft Championship. Online qualifiers lead to 16-team in-person finals at Princeton University. Build intelligent bots, compete for prizes!',
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
  openGraph: {
    title: 'Spring 2026 Championship | BlockWarriors',
    description:
      'Join the ultimate AI Minecraft competition. Online qualifiers → 16-team finals at Princeton.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spring 2026 Championship | BlockWarriors',
    description:
      'Join the ultimate AI Minecraft competition. Online qualifiers → 16-team finals at Princeton.',
  },
};

export default function CompetitionPage() {
  return <CompetitionContent />;
}
