import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status') || 'scheduled';
  const team1 = searchParams.get('team1') || 'Team Alpha';
  const team2 = searchParams.get('team2') || 'Team Beta';
  const score1 = searchParams.get('score1') || '0';
  const score2 = searchParams.get('score2') || '0';
  const winner = searchParams.get('winner') || '';
  const round = searchParams.get('round') || 'Qualifier Round';

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

  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string; glow: string }
  > = {
    scheduled: {
      bg: 'rgba(255, 255, 255, 0.08)',
      text: 'rgba(255, 255, 255, 0.8)',
      label: 'SCHEDULED',
      glow: 'transparent',
    },
    queuing: {
      bg: 'rgba(255, 193, 7, 0.15)',
      text: '#FFC107',
      label: 'QUEUING',
      glow: 'rgba(255, 193, 7, 0.2)',
    },
    waiting: {
      bg: 'rgba(33, 150, 243, 0.15)',
      text: '#2196F3',
      label: 'WAITING',
      glow: 'rgba(33, 150, 243, 0.2)',
    },
    in_progress: {
      bg: 'rgba(255, 107, 0, 0.15)',
      text: '#FF6B00',
      label: '🔴 LIVE NOW',
      glow: 'rgba(255, 107, 0, 0.3)',
    },
    finished: {
      bg: 'rgba(93, 140, 0, 0.15)',
      text: '#5D8C00',
      label: 'COMPLETED',
      glow: 'rgba(93, 140, 0, 0.2)',
    },
    cancelled: {
      bg: 'rgba(244, 67, 54, 0.15)',
      text: '#F44336',
      label: 'CANCELLED',
      glow: 'transparent',
    },
  };

  const config = statusConfig[status] || statusConfig.scheduled;
  const isLive = status === 'in_progress';
  const isFinished = status === 'finished';

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
            top: '50%',
            left: '20%',
            width: '300px',
            height: '300px',
            background:
              winner === 'team1'
                ? 'radial-gradient(circle, rgba(255, 107, 0, 0.2) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(255, 107, 0, 0.08) 0%, transparent 70%)',
            transform: 'translateY(-50%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '20%',
            width: '300px',
            height: '300px',
            background:
              winner === 'team2'
                ? 'radial-gradient(circle, rgba(93, 140, 0, 0.2) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(93, 140, 0, 0.08) 0%, transparent 70%)',
            transform: 'translateY(-50%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(rgba(255, 107, 0, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 0, 0.02) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '32px 60px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              borderRadius: '50px',
              backgroundColor: config.bg,
              border: `1px solid ${config.text}30`,
              boxShadow: isLive ? `0 0 30px ${config.glow}` : 'none',
            }}
          >
            <span
              style={{
                color: config.text,
                fontSize: '18px',
                fontFamily: 'Space Mono',
                letterSpacing: '1px',
              }}
            >
              {config.label}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px',
                fontFamily: 'Space Mono',
              }}
            >
              {round}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: '60px',
            padding: '0 60px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              flex: 1,
            }}
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '24px',
                background:
                  winner === 'team1'
                    ? 'linear-gradient(135deg, #FF6B00, #FF8533)'
                    : 'rgba(255, 107, 0, 0.1)',
                border:
                  winner === 'team1'
                    ? 'none'
                    : '2px solid rgba(255, 107, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  winner === 'team1'
                    ? '0 0 50px rgba(255, 107, 0, 0.4)'
                    : 'none',
              }}
            >
              <span style={{ fontSize: '48px' }}>🤖</span>
            </div>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: winner === 'team1' ? '#FF6B00' : 'white',
                textAlign: 'center',
                maxWidth: '250px',
              }}
            >
              {team1}
            </span>
            {(isLive || isFinished) && (
              <span
                style={{
                  fontSize: '72px',
                  fontWeight: 700,
                  color: winner === 'team1' ? '#FF6B00' : 'white',
                  lineHeight: 1,
                }}
              >
                {score1}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '3px',
                height: '60px',
                background:
                  'linear-gradient(to bottom, transparent, rgba(255, 107, 0, 0.4), transparent)',
                borderRadius: '2px',
              }}
            />
            <span
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              VS
            </span>
            <div
              style={{
                width: '3px',
                height: '60px',
                background:
                  'linear-gradient(to bottom, transparent, rgba(93, 140, 0, 0.4), transparent)',
                borderRadius: '2px',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              flex: 1,
            }}
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '24px',
                background:
                  winner === 'team2'
                    ? 'linear-gradient(135deg, #5D8C00, #7CBD00)'
                    : 'rgba(93, 140, 0, 0.1)',
                border:
                  winner === 'team2'
                    ? 'none'
                    : '2px solid rgba(93, 140, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  winner === 'team2'
                    ? '0 0 50px rgba(93, 140, 0, 0.4)'
                    : 'none',
              }}
            >
              <span style={{ fontSize: '48px' }}>🤖</span>
            </div>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: winner === 'team2' ? '#5D8C00' : 'white',
                textAlign: 'center',
                maxWidth: '250px',
              }}
            >
              {team2}
            </span>
            {(isLive || isFinished) && (
              <span
                style={{
                  fontSize: '72px',
                  fontWeight: 700,
                  color: winner === 'team2' ? '#5D8C00' : 'white',
                  lineHeight: 1,
                }}
              >
                {score2}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 60px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={logoBase64}
              width={32}
              height={32}
              style={{ borderRadius: '8px' }}
            />
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>
              Block<span style={{ color: '#FF6B00' }}>Warriors</span>
            </span>
          </div>
          <span
            style={{
              color: 'rgba(255, 255, 255, 0.35)',
              fontSize: '14px',
              fontFamily: 'Space Mono',
            }}
          >
            Match #{id.slice(0, 12)}
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
