import { test, expect } from '@playwright/test'

// E2E do shell de produção SEM Supabase real (ver playwright.config.ts).
// Fluxos autenticados (iniciar treino, registrar série, retomar, cancelar)
// exigem Supabase local/staging — bloqueio registrado no relatório; a lógica
// desses fluxos é coberta por testes de unidade/componente no vitest.

test('rota protegida sem sessão redireciona para /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
})

test('página de login renderiza formulário utilizável', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('textbox').first()).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
})

test('/offline é público e orienta o usuário (fallback do service worker)', async ({ page }) => {
  await page.goto('/offline')
  await expect(page).toHaveURL(/\/offline$/)
  await expect(page.getByRole('heading', { name: /offline/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /tentar de novo/i })).toBeVisible()
})

test('placeholder neutro de exercício é servido (nunca outro exercício)', async ({ request }) => {
  const response = await request.get('/exercises/placeholder.svg')
  expect(response.status()).toBe(200)
  const body = await response.text()
  expect(body).toContain('Imagem indisponível')
  expect(body).not.toMatch(/squat|supino/i)
})

test('manifest e service worker são servidos SEM sessão (não podem redirecionar ao login)', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest')
  expect(manifest.status()).toBe(200)
  expect(await manifest.text()).toContain('"name"')

  const sw = await request.get('/sw.js')
  expect(sw.status()).toBe(200)
  const swBody = await sw.text()
  expect(swBody).toContain('gymtrack-shell-')
  expect(swBody).not.toContain('<!DOCTYPE html>')
})

test('layout mobile (viewport iPhone) sem rolagem horizontal no login', async ({ page }) => {
  await page.goto('/login')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
