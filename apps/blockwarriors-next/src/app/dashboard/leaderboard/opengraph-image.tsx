import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export const alt = 'BlockWarriors Leaderboard';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '400px',
            background:
              'radial-gradient(ellipse, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(rgba(255, 215, 0, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 215, 0, 0.015) 1px, transparent 1px)`,
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
          <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
            <span style={{ fontSize: '48px' }}>🥇</span>
            <span style={{ fontSize: '48px' }}>🥈</span>
            <span style={{ fontSize: '48px' }}>🥉</span>
          </div>

          <h1
            style={{
              fontSize: '80px',
              fontWeight: 700,
              color: '#FFD700',
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
            Live Tournament Rankings
          </h2>

          <p
            style={{
              fontSize: '22px',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: '24px 0 0 0',
              fontFamily: 'Space Mono',
            }}
          >
            See who's leading the AI Minecraft competition
          </p>
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
            blockwarriors.ai/leaderboard
          </span>
        </div>
      </div>
    ),
    {
      ...size,
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
