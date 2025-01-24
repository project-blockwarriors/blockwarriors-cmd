import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BlockWarriors',
    short_name: 'BlockWarriors',
    description: 'BlockWarriors',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#F26B0C',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
