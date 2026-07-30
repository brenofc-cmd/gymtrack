# Implementação do DUP público v5

Data da entrega: 30/07/2026.

## Resultado

O GymTrack usa `lib/routine/david-laid-public-dup-v5.ts` como fonte canônica da rotina pública. A ficha contém seis dias A–F e 41 entradas, com esforços 1RM/3RM/5RM, séries fixas, barra fixa 8–10, exercícios unilaterais e somente as alternativas explicitamente permitidas.

O arquivo `lib/routine/powerbuilding-v4.ts` existe apenas como reexportação de compatibilidade, sem manter uma segunda definição.

## Banco

Aplicar em ordem:

1. todas as migrations anteriores do projeto;
2. `20260730090000_david_laid_public_dup_v5.sql`;
3. `20260730110000_dup_progression_blocks.sql`.

Com a Supabase CLI:

```bash
supabase db push
```

Em uma instalação nova, também é possível usar:

```bash
supabase db reset
```

A primeira migration cria catálogo e provisionamento idempotente, faz backup/arquivamento não destrutivo e valida 6 dias/41 entradas. A segunda cria máximas e histórico, bloco de nove semanas, escolha estável de alternativas, resultado RM, identificação de deload, identificador offline e RLS.

As funções `SECURITY DEFINER` validam `auth.uid()`. O cliente administrativo não é usado no app.

## Fluxo funcional

1. O onboarding salva perfil, agenda, unidade, incrementos, notificações, dor opcional e confirmação de segurança.
2. O RPC garante rotina e bloco.
3. Máximas testadas ou estimadas são armazenadas separadamente; mudanças geram histórico por trigger.
4. O dashboard chama o mesmo RPC como recuperação idempotente.
5. Ao iniciar a sessão, uma trigger vincula bloco e semana.
6. A tela usa training max, histórico, RIR, técnica, dor e readiness. Sem referência ou histórico, nenhuma carga é inventada.
7. Tentativas RM exigem confirmação de segurança e classificação do resultado.
8. Séries offline usam UUID estável e índice de operação idempotente.
9. A semana só avança após A–F concluídos; a checagem ocorre dentro da transação SQL.

## Honestidade

Séries, repetições, ordem e metas RM são a rotina pública. Training max, Epley, arredondamento, readiness, progressão, deload e bloco de nove semanas são apresentados como:

> Progressão individual calculada pelo GymTrack.

## Validação desta entrega

- `npm ci`: concluído;
- `npm run lint`: concluído sem erros;
- `npm run typecheck`: concluído sem erros;
- `npm test`: 34 arquivos e 324 testes aprovados;
- `npm run build`: build Next.js 16 concluído;
- `npm run test:e2e`: 6 testes Playwright aprovados.

O reset real do Supabase não foi executado neste computador porque Docker/Podman não está instalado. As migrations têm testes estáticos, mas devem ser aplicadas primeiro em um banco local ou staging antes da produção.

## Limitações reais

- O E2E autenticado e a prova dinâmica de isolamento RLS dependem de um projeto Supabase de teste. O E2E local cobre shell, PWA, middleware e layout sem sessão.
- O arquivo de referência textual adicional recebido com o pedido estava vazio; a prescrição foi implementada a partir do prompt mestre anexado.
- Assets de exercícios devem ter licenças revisadas antes de distribuição comercial.
