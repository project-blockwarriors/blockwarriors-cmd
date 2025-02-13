import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BlockWarriors',
    short_name: 'BlockWarriors',
    description: 'BlockWarriors',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D0100',
    theme_color: 'transparent',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
