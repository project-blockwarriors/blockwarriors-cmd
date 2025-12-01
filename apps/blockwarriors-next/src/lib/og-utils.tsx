import { readFile } from 'fs/promises';
import { join } from 'path';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/webp';

/**
 * Load fonts and logo for OG images
 */
export async function loadOGAssets() {
  const [robotoFont, spaceMonoFont, logoData] = await Promise.all([
    readFile(join(process.cwd(), 'src/app/fonts/Roboto-Bold.ttf')),
    readFile(join(process.cwd(), 'src/app/fonts/SpaceMono-Bold.ttf')),
    readFile(join(process.cwd(), 'public/blockwarriors-logo.png')),
  ]);

  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;

  return {
    fonts: [
      {
        name: 'Roboto',
        data: robotoFont,
        style: 'normal' as const,
        weight: 700 as const,
      },
      {
        name: 'Space Mono',
        data: spaceMonoFont,
        style: 'normal' as const,
        weight: 700 as const,
      },
    ],
    logoBase64,
  };
}

/**
 * Common footer component for OG images
 */
export const OGFooter = ({
  logoBase64,
  path,
}: {
  logoBase64: string;
  path: string;
}): JSX.Element => {
  return (
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
        blockwarriors.ai{path}
      </span>
    </div>
  );
};

/**
 * Grid overlay background
 */
export const OGGridOverlay = ({
  color = 'rgba(255, 107, 0, 0.02)',
}: {
  color?: string;
}): JSX.Element => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }}
    />
  );
};

/**
 * Gradient orb background element
 */
export const OGGradientOrb = ({
  color,
  size,
  position,
}: {
  color: string;
  size: number;
  position: { top?: string; bottom?: string; left?: string; right?: string };
}): JSX.Element => {
  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        borderRadius: '50%',
      }}
    />
  );
};

/**
 * Badge component for OG images
 */
export const OGBadge = ({
  icon,
  text,
  color = '#FF6B00',
}: {
  icon: string;
  text: string;
  color?: string;
}): JSX.Element => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 28px',
        borderRadius: '50px',
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
        marginBottom: '36px',
      }}
    >
      <span style={{ fontSize: '22px' }}>{icon}</span>
      <span
        style={{
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: '20px',
          fontFamily: 'Space Mono',
          letterSpacing: '0.5px',
        }}
      >
        {text}
      </span>
    </div>
  );
};

/**
 * Tag pills for OG images
 */
export const OGTags = ({ items }: { items: string[] }): JSX.Element => {
  return (
    <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
      {items.map((item) => (
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
      ))}
    </div>
  );
};

/**
 * Base container styles for OG images
 */
export const ogBaseStyles = {
  container: {
    height: '100%',
    width: '100%',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    backgroundColor: '#0A0A0A',
    position: 'relative' as const,
    fontFamily: 'Roboto',
  },
  centerContent: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: '100%',
    padding: '60px',
    position: 'relative' as const,
    textAlign: 'center' as const,
  },
};

/**
 * Color presets for different page types
 */
export const ogColors = {
  primary: '#FF6B00',
  secondary: '#5D8C00',
  gold: '#FFD700',
  white: 'white',
  muted: 'rgba(255, 255, 255, 0.7)',
  subtle: 'rgba(255, 255, 255, 0.4)',
};
