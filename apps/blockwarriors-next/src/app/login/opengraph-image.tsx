import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export const alt = 'Sign In to BlockWarriors';
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
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '500px',
            height: '400px',
            background:
              'radial-gradient(ellipse, rgba(255, 107, 0, 0.1) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(rgba(255, 107, 0, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 0, 0.02) 1px, transparent 1px)`,
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
            <span style={{ color: '#FF6B00' }}> BlockWarriors</span>
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
            blockwarriors.ai/login
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
