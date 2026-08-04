import type { MetadataRoute } from 'next'

/**
 * Manifest da PWA. Os arquivos referenciados aqui são gerados por
 * `node scripts/generate-pwa-icons.mjs` e versionados em public/icons/.
 * tests/pwa-assets.test.ts falha se algum asset referenciado não existir.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GymTrack — Treino e progressão',
    short_name: 'GymTrack',
    description: 'Seu app pessoal de treino: powerbuilding adaptado, progressão e recuperação.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'pt-BR',
    dir: 'ltr',
    categories: ['health', 'fitness', 'lifestyle'],
    background_color: '#eef0ed',
    theme_color: '#eef0ed',
    icons: [
      // `any` e `maskable` separados: um ícone único marcado com os dois
      // propósitos é recortado pelo Android e perde parte do desenho.
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
