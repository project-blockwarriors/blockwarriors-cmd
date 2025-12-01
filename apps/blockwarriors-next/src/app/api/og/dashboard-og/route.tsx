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
          color="rgba(93, 140, 0, 0.12)"
          size={400}
          position={{ top: '-10%', right: '10%' }}
        />
        <OGGridOverlay color="rgba(93, 140, 0, 0.02)" />

        <div style={ogBaseStyles.centerContent}>
          <OGBadge
            icon="📊"
            text="Player Dashboard"
            color={ogColors.secondary}
          />

          <h1
            style={{
              fontSize: '80px',
              fontWeight: 700,
              color: ogColors.secondary,
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-2px',
            }}
          >
            Dashboard
          </h1>

          <h2
            style={{
              fontSize: '40px',
              fontWeight: 700,
              color: 'white',
              margin: '20px 0 0 0',
            }}
          >
            Tournament Overview
          </h2>

          <OGTags items={['Track Progress', 'View Matches', 'Compete']} />
        </div>

        <OGFooter logoBase64={logoBase64} path="/dashboard" />
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

