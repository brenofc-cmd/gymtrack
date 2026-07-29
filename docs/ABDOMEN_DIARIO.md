# Abdômen Diário

O **Abdômen Diário** é uma área independente da musculação principal. A rotina matinal dura de 5 a 12 minutos e alterna três sessões de hipertrofia com estabilidade, recuperação ativa e descanso completo. Séries e métricas desta área ficam nas tabelas `daily_core_*` e não entram silenciosamente no volume da ficha principal.

## Semana

| Dia | Sessão | Tipo | Conteúdo |
| --- | --- | --- | --- |
| Segunda | Flexão do tronco | Hipertrofia | Crunch com carga, 3×10–15, RIR 1–2 |
| Terça | Estabilidade leve | Leve | Dead bug e prancha lateral |
| Quarta | Elevação pélvica | Hipertrofia | Reverse crunch, 3×8–15, RIR 1–2 |
| Quinta | Controle e anti-rotação | Leve | Bird dog e Pallof press; sem elástico usa alternativa |
| Sexta | Anti-extensão | Hipertrofia | Ab wheel 3×6–12; sem roda usa prancha longa |
| Sábado | Recuperação ativa | Muito leve | Dead bug, prancha frontal e respiração |
| Domingo | Descanso | Descanso | Check-in opcional de dor e recuperação |

Dias fortes registram repetições/tempo, carga, RIR, qualidade de execução, dor e controle lombar quando relevante. Dias leves priorizam coordenação e postura e nunca sugerem falha.

## Progressão e adaptação

- Repetições/carga usam progressão dupla: só progride ao atingir o topo da faixa em todas as séries, com execução boa ou excelente, RIR mínimo de 1 e sem dor.
- Pranchas aumentam 5–10 segundos por etapa e param no limite superior antes de trocar a variação.
- Ab wheel também exige controle lombar explícito; técnica aceitável/ruim ou perda de postura impede aumento de amplitude.
- Dor moderada, forte ou lombar bloqueia qualquer progressão e recomenda interromper o exercício, sem diagnosticar lesão.
- Semana 1: duas séries nos exercícios fortes e aproximadamente RIR 3.
- Semana 2: até três séries, se não houver dor excessiva, ainda com aproximadamente RIR 3.
- Depois disso entra a progressão normal. Usuários experientes podem pular a adaptação após confirmação.

As regras puras ficam em `lib/daily-core/logic.ts`. Para alterar a prescrição, crie uma migration que atualize `daily_core_days`, `daily_core_exercises` e `daily_core_variations`; não altere sessões ou séries históricas.

## Equipamentos, lembretes e offline

O onboarding salva roda abdominal, elástico, mochila, contagem manual, horário e lembrete. As preferências podem ser revistas em `/abdomen/configuracoes`.

O lembrete usa a API de notificações do navegador quando permitida, além de som/vibração compatíveis. Ele oferece adiamento de 10 minutos e pausa temporária por meio dos campos `snoozed_until` e `disabled_until`. Como navegadores não garantem agendamento local com o app totalmente fechado, o lembrete é disparado enquanto o app/PWA está ativo; push em segundo plano exigiria um agendador de servidor e chaves VAPID, que este projeto ainda não possui.

A sessão ativa, séries e timers baseados em timestamp são persistidos em `localStorage`. Escritas usam UUIDs gerados no cliente e uma fila idempotente; ao voltar a conexão, sessões são sincronizadas antes das séries. O indicador na execução mostra itens pendentes.

Desde a auditoria P0/P1, um service worker mínimo (`public/sw.js`, registrado só em produção por `components/providers/ServiceWorkerRegistration.tsx`) cacheia o shell (`/`, `/treinos`, `/abdomen`, `/offline`) com cache versionado (`lib/offline/swCache.ts`): navegações usam network-first com fallback ao cache e à página `/offline`; estáticos usam stale-while-revalidate. O SW **não** sincroniza dados — isso continua sendo responsabilidade exclusiva da fila idempotente.

Durante a sessão (musculação e abdômen), o hook `lib/hooks/useWakeLock.ts` mantém a tela ligada via Screen Wake Lock API quando o aparelho suporta, com reaquisição ao voltar ao app e falha silenciosa em navegadores sem suporte. O toggle "Manter tela ligada" fica em `/configuracoes` (`user_preferences.keep_screen_awake`).

## Banco de dados

A migration `supabase/migrations/20260717010046_daily_core.sql` cria:

- `daily_core_days`, `daily_core_exercises`, `daily_core_variations`: catálogo global normalizado;
- `daily_core_preferences`, `daily_core_reminders`: preferências por usuário;
- `daily_core_sessions`, `daily_core_sets`: histórico independente e idempotente;
- `daily_core_progressions`, `daily_core_pain_logs`: sugestões e segurança;
- `daily_core_main_exercise_conflicts`: trilha reversível dos itens ocultados na ficha principal.

Todas as tabelas expostas têm RLS. Catálogo é somente leitura para autenticados; dados pessoais exigem `(select auth.uid()) = user_id`. FKs têm índices nos acessos e cascatas relevantes.

## Duplicidade com a musculação principal

Antes desta funcionalidade, a ficha v3 possuía Cable crunch na segunda, Reverse crunch na quarta e Ab wheel no sábado, todos com quatro séries. A migration:

1. cria um snapshot `pre-daily-core-v1` em `routine_backups`;
2. registra cada `workout_exercise_id` em `daily_core_main_exercise_conflicts` com seu `is_hidden` anterior;
3. define `is_hidden = true` apenas nesses itens dos modelos ativos v3.

Nenhum `workout_session`, `set_log`, treino ou exercício é apagado. Consultas de histórico continuam usando os registros originais.

## Aplicar, testar e restaurar

Após configurar o Supabase CLI para o projeto:

```bash
supabase db push
npm run typecheck
npm run lint
npm test
npm run build
```

O Supabase CLI não estava disponível no ambiente em que a feature foi criada; por isso a migration segue a numeração existente e deve ser aplicada no projeto vinculado antes do primeiro acesso.

Para restaurar a ficha anterior sem apagar o histórico do Abdômen Diário:

```sql
update public.workout_exercises we
set is_hidden = c.was_hidden
from public.daily_core_main_exercise_conflicts c
where c.workout_exercise_id = we.id;
```

O bloco completo de rollback, incluindo a ordem segura de remoção das tabelas, está no início da migration. Faça backup do banco antes de remover tabelas com dados já sincronizados.

## Aviso

Esta rotina apresenta orientações gerais de exercício. Ela não substitui avaliação de médico ou profissional de educação física. Interrompa o exercício caso sinta dor forte, dor lombar ou desconforto progressivo.
