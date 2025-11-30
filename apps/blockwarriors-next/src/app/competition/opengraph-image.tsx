import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export const alt = 'BlockWarriors Competition';
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
            top: '-15%',
            right: '-5%',
            width: '500px',
            height: '500px',
            background:
              'radial-gradient(circle, rgba(255, 107, 0, 0.18) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: '400px',
            height: '400px',
            background:
              'radial-gradient(circle, rgba(93, 140, 0, 0.1) 0%, transparent 70%)',
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
              backgroundColor: 'rgba(255, 107, 0, 0.15)',
              border: '1px solid rgba(255, 107, 0, 0.3)',
              marginBottom: '32px',
            }}
          >
            <span style={{ fontSize: '22px' }}>🏆</span>
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '20px',
                fontFamily: 'Space Mono',
              }}
            >
              AI Tournament
            </span>
          </div>

          <h1
            style={{
              fontSize: '76px',
              fontWeight: 700,
              color: '#FF6B00',
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

          <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
            {['16 Teams', 'Online Qualifiers', 'In-Person Finals'].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontSize: '18px',
                    fontFamily: 'Space Mono',
                  }}
                >
                  {item}
                </div>
              )
            )}
          </div>
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
            blockwarriors.ai/competition
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
