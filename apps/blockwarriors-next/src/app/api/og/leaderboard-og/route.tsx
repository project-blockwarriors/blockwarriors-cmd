import { ImageResponse } from 'next/og';
import {
  loadOGAssets,
  OGFooter,
  OGGridOverlay,
  OGGradientOrb,
  OGBadge,
  OGTags,
  OG_SIZE,
  ogBaseStyles,
  ogColors,
} from '@/lib/og-utils';

export const runtime = 'nodejs';

export async function GET() {
  const { fonts, logoBase64 } = await loadOGAssets();

  return new ImageResponse(
    (
      <div style={ogBaseStyles.container}>
        <OGGradientOrb
          color="rgba(255, 215, 0, 0.12)"
          size={450}
          position={{ top: '-10%', right: '5%' }}
        />
        <OGGradientOrb
          color="rgba(93, 140, 0, 0.08)"
          size={350}
          position={{ bottom: '-15%', left: '-5%' }}
        />
        <OGGridOverlay color="rgba(255, 215, 0, 0.02)" />

        <div style={ogBaseStyles.centerContent}>
          <OGBadge icon="🥇" text="Live Rankings" color={ogColors.gold} />

          <h1
            style={{
              fontSize: '80px',
              fontWeight: 700,
              color: ogColors.gold,
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-2px',
            }}
          >
            Leaderboard
          </h1>

          <h2
            style={{
              fontSize: '40px',
              fontWeight: 700,
              color: 'white',
              margin: '20px 0 0 0',
            }}
          >
            Tournament Rankings
          </h2>

          <OGTags items={['Top Teams', 'Win Rates', 'Match History']} />
        </div>

        <OGFooter logoBase64={logoBase64} path="/dashboard/leaderboard" />
      </div>
    ),
    {
      ...OG_SIZE,
      fonts,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}

