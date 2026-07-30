# GymTrack

App pessoal de acompanhamento de treino (Next.js 16 App Router + Supabase) com a divisão **DUP pública associada a David Laid v5**: seis dias A–F, prescrição pública bloqueada, progressão individual transparente do GymTrack, referências de máxima, bloco de nove semanas, readiness, deload, Abdômen Diário independente, cronômetro persistido e fila offline idempotente. Cancelamentos são lógicos e o histórico nunca é apagado.

Produção: <https://brendongym.vercel.app>

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/ROTINA.md](docs/ROTINA.md) | DUP público v5, máximas, bloco, segurança, migrations e rollback |
| [docs/IMPLEMENTACAO_DUP_V5.md](docs/IMPLEMENTACAO_DUP_V5.md) | Entrega, fluxo funcional, validação e limitações reais |
| [docs/ABDOMEN_DIARIO.md](docs/ABDOMEN_DIARIO.md) | Abdômen Diário, offline/service worker, Wake Lock |
| [docs/PESQUISA_REFERENCIAS_PRODUTO_E_TREINO.md](docs/PESQUISA_REFERENCIAS_PRODUTO_E_TREINO.md) | Matriz de 8 apps, dossiê David Laid, evidência científica |
| [docs/RELATORIO_AUDITORIA.md](docs/RELATORIO_AUDITORIA.md) | Execução da auditoria P0/P1 (histórico) |
| [docs/RELATORIO_CORRECOES_FINAIS.md](docs/RELATORIO_CORRECOES_FINAIS.md) | Rodada de correções da auditoria final |
| [docs/AUDITORIA_DELTA_POWERBUILDING_FINAL.md](docs/AUDITORIA_DELTA_POWERBUILDING_FINAL.md) | Auditoria requisito × estado do método powerbuilding |
| [docs/RELATORIO_POWERBUILDING_FINAL.md](docs/RELATORIO_POWERBUILDING_FINAL.md) | Integração do método powerbuilding (atual) |
| [docs/HANDOFF_REFORMULACAO.md](docs/HANDOFF_REFORMULACAO.md) | Registro histórico da reformulação visual |

## Requisitos

- Node.js 20+ (desenvolvido com Node 24) e npm 10+
- Projeto Supabase (para rodar autenticado)
- Para E2E: Google Chrome instalado (o Playwright usa `channel: 'chrome'`)

## Instalação limpa

```bash
npm ci
```

## Variáveis de ambiente

Crie `.env.local` (nunca commitado):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
# Apenas para scripts administrativos (scripts/seed.ts) — NUNCA usada no app:
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

Sem as variáveis, o app sobe e todas as rotas protegidas redirecionam para `/login` (estado de configuração ausente); `/offline`, `/sw.js` e `/manifest.webmanifest` permanecem públicos.

## Banco de dados

Migrations em `supabase/migrations/` (ordem cronológica, com rollback seguro documentado):

```bash
supabase db push
```

Ou aplique cada arquivo em ordem no SQL Editor do Dashboard. A v5 arquiva a ficha anterior e preserva `workout_sessions`, `set_logs` e dados do Abdômen Diário. Seed opcional do catálogo: `npm run seed` (usa a service role; requer `.env.local`).

## Rodando

```bash
npm run dev        # desenvolvimento (http://localhost:3000)
npm run build      # build de produção (sem rede de fontes — Geist é self-hosted)
npm run start      # serve o build
```

## Testes

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # Vitest (unidade/componente/migrations)
npm run test:e2e   # build + Playwright (shell sem sessão; usa o Chrome do sistema)
```

Fluxos autenticados de ponta a ponta e validação de RLS real exigem Supabase local (Docker + Supabase CLI) ou staging — ver limitações abaixo.

## Deploy manual

1. Aplicar as migrations pendentes (`supabase db push`) **antes** do deploy.
2. Build + deploy (Vercel): `vercel --prod` com as variáveis de ambiente configuradas no projeto.
3. Validar no navegador: login, dashboard, sessão, `/offline` (DevTools → Offline) e registro do service worker.

Rollback de app = redeploy da versão anterior na Vercel. Rollback de banco = seguir o bloco comentado da migration correspondente (somente se o ambiente não for produção com dados reais).

## Empacotamento limpo

```bash
./scripts/package.sh
```

Gera `gymtrack-<data>.zip` a partir do índice do git (sem `node_modules`, `.next`, `.env*`, caches ou artefatos locais).

## Limitações conhecidas

- Sem validação de RLS contra Supabase real no ambiente de desenvolvimento (sem Docker/CLI); validar em staging conforme docs/RELATORIO_CORRECOES_FINAIS.md.
- E2E cobre o shell sem sessão; fluxos autenticados são cobertos por testes de unidade/componente.
- A referência textual adicional anexada ao pedido chegou vazia; a prescrição foi travada pelo prompt mestre fornecido.
- As imagens locais do catálogo são demonstrativas; validar licenças e substituir assets antes de distribuição comercial.
- `/alimentacao` e `/suplementos` têm escopo parcial (ver seção de escopo complementar no relatório de correções).
