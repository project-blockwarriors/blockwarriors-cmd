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
          color="rgba(255, 107, 0, 0.18)"
          size={500}
          position={{ top: '-15%', right: '-5%' }}
        />
        <OGGradientOrb
          color="rgba(93, 140, 0, 0.1)"
          size={400}
          position={{ bottom: '-20%', left: '-10%' }}
        />
        <OGGridOverlay color="rgba(255, 107, 0, 0.025)" />

        <div style={ogBaseStyles.centerContent}>
          <OGBadge icon="🏆" text="AI Tournament" color={ogColors.primary} />

          <h1
            style={{
              fontSize: '76px',
              fontWeight: 700,
              color: ogColors.primary,
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '-2px',
            }}
          >
            Competition
          </h1>
          <h2
            style={{
              fontSize: '56px',
              fontWeight: 700,
              color: 'white',
              margin: '8px 0 0 0',
              letterSpacing: '-1px',
            }}
          >
            Details
          </h2>

          <OGTags
            items={['16 Teams', 'Online Qualifiers', 'In-Person Finals']}
          />
        </div>

        <OGFooter logoBase64={logoBase64} path="/competition" />
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

