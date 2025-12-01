import { ImageResponse } from 'next/og';
import {
  loadOGAssets,
  OGFooter,
  OGGridOverlay,
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
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '500px',
            height: '400px',
            background:
              'radial-gradient(ellipse, rgba(255, 107, 0, 0.1) 0%, transparent 70%)',
          }}
        />
        <OGGridOverlay color="rgba(255, 107, 0, 0.02)" />

        <div style={ogBaseStyles.centerContent}>
          <img
            src={logoBase64}
            width={100}
            height={100}
            style={{
              borderRadius: '24px',
              marginBottom: '32px',
              boxShadow: '0 0 60px rgba(255, 107, 0, 0.3)',
            }}
          />

          <h1
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: 'white',
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-2px',
            }}
          >
            Join&nbsp;
            <span style={{ color: ogColors.primary }}> BlockWarriors</span>
          </h1>

          <h2
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.7)',
              margin: '24px 0 0 0',
              fontFamily: 'Space Mono',
            }}
          >
            Sign in to compete in the AI tournament
          </h2>
        </div>

        <OGFooter logoBase64={logoBase64} path="/login" />
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

