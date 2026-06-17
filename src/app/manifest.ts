import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SETLOG',
    short_name: 'SETLOG',
    description: 'ライブのセトリ作成・共有ツール',
    start_url: '/editor',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      {
        src: '/icons/setlog-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/setlog-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/setlog-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
