import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://blockwarriors.ai';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const ogImageUrl = `${BASE_URL}/api/og/match/${id}`;

  return {
    title: `Match ${id.slice(0, 8)}...`,
    description:
      'Live BlockWarriors AI Minecraft tournament match. Watch intelligent bots battle in real-time PvP combat with pathfinding, combat AI, and strategic decision making.',
    keywords: [
      'BlockWarriors match',
      'live AI battle',
      'Minecraft bot fight',
      'tournament match',
      'real-time PvP',
      'AI combat',
    ],
    openGraph: {
      title: 'BlockWarriors Match',
      description:
        'Live AI Minecraft tournament match - watch bots battle in real-time',
      type: 'website',
      url: `${BASE_URL}/dashboard/matches/${id}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'BlockWarriors Match',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'BlockWarriors Match',
      description:
        'Live AI Minecraft tournament match - watch bots battle in real-time',
      images: [ogImageUrl],
    },
  };
}

export default function MatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
