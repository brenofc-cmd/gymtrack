# Validação de RLS — GymTrack

**Data:** 29/07/2026 · **Ambiente:** macOS 12, Node v24.18.0

---

## ⚠️ RLS NÃO VALIDADA EM BANCO REAL

Este é o estado factual. Nenhuma afirmação de "RLS validada" deve ser feita com base neste documento.

### Bloqueio exato

```
$ which docker
docker: command not found

$ which supabase
supabase not found
```

Não há Docker nem Supabase CLI nesta máquina, e não há credenciais de um projeto de staging disponíveis na sessão. Sem isso é impossível:

- subir um banco local limpo;
- aplicar as migrations e os seeds contra um Postgres real;
- criar dois usuários autenticados;
- exercer as políticas com `auth.uid()` real.

O `SUPABASE_SERVICE_ROLE_KEY` existente no `.env.local` **não** serve para este teste: ele ignora RLS por definição — usá-lo provaria o contrário do que se quer verificar.

---

## O que ESTÁ verificado (sem banco real)

| Verificação | Como | Evidência |
|---|---|---|
| Nenhum uso de service role no app | Varredura de `app/` e `components/` | `tests/no-admin-client-in-app.test.ts` |
| Toda tabela nova tem RLS habilitada | Parsing das migrations | `tests/baseline-missing-tables.test.ts` |
| 4 políticas (select/insert/update/delete) por tabela | Parsing das migrations | idem |
| Políticas por dono usam `(select auth.uid()) = user_id` | Parsing das migrations | idem |
| Catálogos (`food_items`, `recipes`, `supplements`) só leem itens globais | Parsing | idem |
| Tabelas-filhas herdam o dono do pai | Parsing | idem |
| `user_preferences` chaveada por `id = auth.uid()` | Parsing | idem |
| Sessões: política `for all using (auth.uid() = user_id)` cobre o cancelamento | Parsing | `tests/session-integrity.test.ts` |
| Cadeia de migrations não apaga histórico | Parsing de todas as migrations | `tests/migration-chain.test.ts` |
| Cache do SW não guarda página autenticada | Estático + unidade | `tests/sw-cache.test.ts` |
| Logout limpa Cache Storage e localStorage | Estático + unidade | idem |

Isto é **verificação de contrato**, não prova de execução. Uma política pode estar sintaticamente correta e ainda assim ter lógica errada — só o banco real responde isso.

---

## Roteiro para executar quando houver Docker/CLI

```bash
# 1. Ambiente limpo
supabase init            # se ainda não houver supabase/config.toml
supabase start           # sobe Postgres + GoTrue local

# 2. Aplicar a cadeia completa do zero
supabase db reset        # roda TODAS as migrations em ordem, do zero
#    ↳ atenção: até a correção 0004a, este passo FALHAVA na migration 0005
#      (constraint de workouts.letter só aceitava A–E e a rotina insere 'F')

# 3. Seeds
npm run seed

# 4. Dois usuários de teste (nunca credenciais reais)
#    Criar via GoTrue local: usuário A e usuário B

# 5. Para cada tabela, autenticado como A, tentar contra dados de B:
#    SELECT / UPDATE / DELETE  → devem retornar 0 linhas ou erro
#    INSERT com user_id de B   → deve falhar na policy WITH CHECK
```

### Tabelas a cobrir

`user_profiles` · `user_preferences` · `workouts` · `workout_exercises` · `workout_exercise_substitutions` · `workout_sessions` · `set_logs` · `daily_readiness` · `deload_recommendations` · `routine_backups` · todas as `daily_core_*` (10) · `body_measurements` · `body_weight_logs` · `sleep_logs` · `recovery_logs` · `hydration_logs` · `nutrition_goals` · `meals` · `meal_entries` · `food_items` · `recipes` · `recipe_ingredients` · `supplements` · `supplement_logs`

### Resultado esperado

- Usuário só acessa os próprios dados.
- Catálogos globais (`user_id is null`) são legíveis por qualquer autenticado e **não** graváveis.
- Nenhuma operação do app depende de `service_role`.
- `scripts/seed.ts` continua sendo o único consumidor do client administrativo.

### Verificações extras da cadeia

```bash
# Banco limpo: todas as migrations em sequência
supabase db reset

# Banco existente: simular atualização a partir da estrutura anterior
#   restaurar dump de produção em um branch → supabase db push
#   confirmar: sessões, séries e rotinas preservadas; colunas novas com default
```

---

## Pendência

Enquanto este documento não registrar execução real com dois usuários, a categoria **Segurança e RLS não pode receber nota máxima**. O relatório final reflete isso.
