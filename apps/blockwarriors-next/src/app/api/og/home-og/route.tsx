import { ImageResponse } from 'next/og';
import {
  loadOGAssets,
  OGFooter,
  OGGridOverlay,
  OGGradientOrb,
  OG_SIZE,
  ogBaseStyles,
  ogColors,
} from '@/lib/og-utils';

export const runtime = 'nodejs';

export async function GET() {
  const { fonts, logoBase64 } = await loadOGAssets();

  return new ImageResponse(
    (
      <div style={{ ...ogBaseStyles.container, flexDirection: 'row' }}>
        {/* Background gradient orbs */}
        <OGGradientOrb
          color="rgba(255, 107, 0, 0.12)"
          size={600}
          position={{ top: '-20%', right: '10%' }}
        />
        <OGGradientOrb
          color="rgba(93, 140, 0, 0.08)"
          size={500}
          position={{ bottom: '-30%', left: '-10%' }}
        />

        {/* Grid pattern overlay */}
        <OGGridOverlay color="rgba(255, 107, 0, 0.03)" />

        {/* Left Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '80px',
            flex: 1,
            position: 'relative',
          }}
        >
          {/* Main title */}
          <h1
            style={{
              fontSize: '96px',
              fontWeight: 700,
              color: ogColors.primary,
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-2px',
            }}
          >
            BlockWarriors
          </h1>

          {/* Subtitle */}
          <h2
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: 'white',
              margin: '16px 0 0 0',
              lineHeight: 1.2,
            }}
          >
            AI Meets Minecraft
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: '24px 0 0 0',
              maxWidth: '500px',
              lineHeight: 1.5,
              fontFamily: 'Space Mono',
            }}
          >
            Build intelligent bots that battle in real-time PvP arenas
          </p>
        </div>

        {/* Right Side - Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '400px',
            position: 'relative',
          }}
        >
          <img
            src={logoBase64}
            width={280}
            height={280}
            style={{
              borderRadius: '40px',
              boxShadow: '0 0 80px rgba(255, 107, 0, 0.3)',
            }}
          />
        </div>

        {/* Bottom branding bar */}
        <OGFooter logoBase64={logoBase64} path="" />
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

