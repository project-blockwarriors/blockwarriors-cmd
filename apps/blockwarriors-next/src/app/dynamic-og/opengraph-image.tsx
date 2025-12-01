import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export const alt = 'BlockWarriors - AI Minecraft Tournament';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // Load fonts
  const robotoFont = await readFile(
    join(process.cwd(), 'src/app/fonts/Roboto-Bold.ttf')
  );
  const spaceMonoFont = await readFile(
    join(process.cwd(), 'src/app/fonts/SpaceMono-Bold.ttf')
  );

  // Load logo
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
          flexDirection: 'row',
          backgroundColor: '#0A0A0A',
          position: 'relative',
          fontFamily: 'Roboto',
        }}
      >
        {/* Background gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '10%',
            width: '600px',
            height: '600px',
            background:
              'radial-gradient(circle, rgba(255, 107, 0, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-10%',
            width: '500px',
            height: '500px',
            background:
              'radial-gradient(circle, rgba(93, 140, 0, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(rgba(255, 107, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 0, 0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

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
              color: '#FF6B00',
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
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 80px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'white',
            }}
          >
            Block
            <span style={{ color: '#FF6B00' }}>Warriors</span>
          </span>
          <span
            style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '18px',
              fontFamily: 'Space Mono',
            }}
          >
            blockwarriors.ai
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Roboto',
          data: robotoFont,
          style: 'normal',
          weight: 700,
        },
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


