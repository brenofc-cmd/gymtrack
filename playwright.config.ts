import { defineConfig, devices } from '@playwright/test'

/**
 * E2E sem Supabase real: cobre o build de produção servindo login, /offline,
 * assets (placeholder, manifest, sw.js) e o comportamento do middleware sem
 * sessão. Fluxos autenticados e RLS exigem um Supabase local (Docker) ou de
 * staging — bloqueio registrado em docs/RELATORIO_CORRECOES_FINAIS.md.
 *
 * Usa o Chrome do sistema (channel: 'chrome') porque o download do Chromium
 * do Playwright não suporta macOS 12.
 *
 * Requer build prévio: `npm run build` (o webServer roda `next start`).
 */
export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['iPhone 13'], channel: 'chrome', defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run start -- -p 3100',
    url: 'http://localhost:3100/login',
    reuseExistingServer: true,
    timeout: 60_000,
    // Sem NEXT_PUBLIC_SUPABASE_*: o middleware roda o caminho "ambiente sem
    // configuração" — deterministico para estes testes.
    env: { NODE_ENV: 'production' },
  },
})
