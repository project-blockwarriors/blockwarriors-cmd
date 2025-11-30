import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const title = searchParams.get('title') || 'BlockWarriors';
  const subtitle = searchParams.get('subtitle') || 'AI Meets Minecraft';
  const type = searchParams.get('type') || 'default';

  const robotoFont = await readFile(
    join(process.cwd(), 'src/app/fonts/Roboto-Bold.ttf')
  );
  const spaceMonoFont = await readFile(
    join(process.cwd(), 'src/app/fonts/SpaceMono-Bold.ttf')
  );
  const logoData = await readFile(
    join(process.cwd(), 'public/blockwarriors-logo.png')
  );
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;

  const typeConfig: Record<
    string,
    { badge: string; accent: string; icon: string }
  > = {
    default: { badge: 'AI Gaming Tournament', accent: '#FF6B00', icon: '⚔️' },
    competition: {
      badge: 'AI Tournament',
      accent: '#FF6B00',
      icon: '🏆',
    },
    dashboard: { badge: 'Player Dashboard', accent: '#5D8C00', icon: '📊' },
    leaderboard: { badge: 'Live Rankings', accent: '#5D8C00', icon: '🥇' },
    matches: { badge: 'Tournament Matches', accent: '#FF6B00', icon: '⚔️' },
  };

  const config = typeConfig[type] || typeConfig.default;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0A0A0A',
          position: 'relative',
          fontFamily: 'Roboto',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-5%',
            width: '500px',
            height: '500px',
            background: `radial-gradient(circle, ${config.accent}20 0%, transparent 70%)`,
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-25%',
            left: '-5%',
            width: '400px',
            height: '400px',
            background:
              'radial-gradient(circle, rgba(93, 140, 0, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(rgba(255, 107, 0, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 0, 0.025) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '60px',
            position: 'relative',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 28px',
              borderRadius: '50px',
              backgroundColor: `${config.accent}15`,
              border: `1px solid ${config.accent}30`,
              marginBottom: '36px',
            }}
          >
            <span style={{ fontSize: '20px' }}>{config.icon}</span>
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '20px',
                fontFamily: 'Space Mono',
                letterSpacing: '0.5px',
              }}
            >
              {config.badge}
            </span>
          </div>

          <h1
            style={{
              fontSize: '88px',
              fontWeight: 700,
              color: config.accent,
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-2px',
            }}
          >
            {title}
          </h1>

          <h2
            style={{
              fontSize: '44px',
              fontWeight: 700,
              color: 'white',
              margin: '20px 0 0 0',
              lineHeight: 1.2,
            }}
          >
            {subtitle}
          </h2>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 60px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={logoBase64}
              width={36}
              height={36}
              style={{ borderRadius: '8px' }}
            />
            <span style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}>
              Block<span style={{ color: '#FF6B00' }}>Warriors</span>
            </span>
          </div>
          <span
            style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '16px',
              fontFamily: 'Space Mono',
            }}
          >
            blockwarriors.ai
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Roboto', data: robotoFont, style: 'normal', weight: 700 },
        {
          name: 'Space Mono',
          data: spaceMonoFont,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}
