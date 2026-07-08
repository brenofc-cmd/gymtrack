/**
 * Gera supabase/migrations/0005_rotina_v2_data.sql a partir de
 * lib/routine/rotina-v2.ts (fonte única da verdade).
 *
 * Uso: npx tsx scripts/generate-rotina-v2-sql.ts
 *
 * A migration gerada:
 *  1. Faz backup (jsonb) da ficha ativa em routine_backups.
 *  2. Arquiva os treinos ativos (is_archived = true) — sem apagar nada.
 *  3. Cria/reutiliza exercícios do catálogo por name_pt (find-or-create).
 *  4. Insere os 6 novos treinos (routine_version = 2) com exercícios,
 *     RIR, descanso, orientações e substituições.
 *  5. Preserva todas as sessões e set_logs existentes (nenhum update/delete).
 *
 * Reversível: um bloco de rollback documentado no fim do arquivo gerado.
 */

import { writeFileSync } from 'fs'
import path from 'path'
import { ROTINA_V2, ROUTINE_VERSION } from '../lib/routine/rotina-v2'
import type { RoutineExerciseDef } from '../lib/routine/rotina-v2'

function q(s: string): string {
  return `'${s.replace(/'/g, "''")}'`
}

function textArray(items: string[]): string {
  if (items.length === 0) return 'null'
  return `array[${items.map(q).join(', ')}]`
}

/** Metadados de catálogo para exercícios de substituição que podem não existir. */
const SUB_CATALOG: Record<
  string,
  { muscle: string; equipment: string; kind: string; pattern?: string; instructions: string[] }
> = {
  'Supino inclinado na máquina': {
    muscle: 'peito', equipment: 'máquina', kind: 'composto',
    instructions: ['Ajuste o banco e empurre com controle', 'Foco no peitoral superior'],
  },
  'Supino inclinado (barra)': {
    muscle: 'peito', equipment: 'barra', kind: 'composto',
    instructions: ['Banco a 30-45°', 'Desça a barra até o peitoral superior com controle'],
  },
  'Supino reto com halteres (chest press)': {
    muscle: 'peito', equipment: 'halter', kind: 'composto',
    instructions: ['Desça os halteres com controle até o alongamento confortável'],
  },
  'Supino em máquina': {
    muscle: 'peito', equipment: 'máquina', kind: 'composto',
    instructions: ['Escápulas apoiadas', 'Empurre e retorne com controle'],
  },
  'Pulldown pegada neutra': {
    muscle: 'costas', equipment: 'cabo', kind: 'composto',
    instructions: ['Puxe em direção ao peitoral superior', 'Foque na contração do dorsal'],
  },
  'Barra fixa assistida (ou puxada neutra)': {
    muscle: 'costas', equipment: 'máquina', kind: 'composto',
    instructions: ['Amplitude completa com controle'],
  },
  'Remada em máquina com apoio': {
    muscle: 'costas', equipment: 'máquina', kind: 'composto',
    instructions: ['Peito apoiado', 'Puxe com as costas, sem impulso'],
  },
  'Remada T (ou máquina com apoio)': {
    muscle: 'costas', equipment: 'máquina', kind: 'composto',
    instructions: ['Tronco apoiado', 'Retraia as escápulas no pico'],
  },
  'Agachamento livre': {
    muscle: 'quadríceps', equipment: 'barra', kind: 'composto',
    instructions: ['Desça com controle até amplitude segura', 'Joelhos na direção dos pés'],
  },
  'Agachamento no Smith': {
    muscle: 'quadríceps', equipment: 'máquina', kind: 'composto',
    instructions: ['Use quando tecnicamente adequado', 'Amplitude consistente'],
  },
  'Mesa flexora': {
    muscle: 'isquiotibiais', equipment: 'máquina', kind: 'isolador',
    instructions: ['Flexione com controle, sem levantar o quadril'],
  },
  'Flexora unilateral': {
    muscle: 'isquiotibiais', equipment: 'máquina', kind: 'isolador',
    instructions: ['Uma perna por vez, com controle total'],
  },
  'Abdominal na máquina (com carga)': {
    muscle: 'abdômen', equipment: 'máquina', kind: 'abdominal', pattern: 'flexao_tronco',
    instructions: ['Flexione o tronco contraindo o abdômen', 'Controle o retorno'],
  },
  'Crunch com anilha (resistência)': {
    muscle: 'abdômen', equipment: 'anilha', kind: 'abdominal', pattern: 'flexao_tronco',
    instructions: ['Anilha no peito', 'Aproxime as costelas da pelve com controle'],
  },
  'Capitão (elevação de joelhos)': {
    muscle: 'abdômen', equipment: 'corpo', kind: 'abdominal', pattern: 'retroversao_pelvica',
    instructions: ['Enrole a pelve ao subir os joelhos', 'Sem balanço'],
  },
  'Elevação de joelhos pendurado': {
    muscle: 'abdômen', equipment: 'corpo', kind: 'abdominal', pattern: 'retroversao_pelvica',
    instructions: ['Somente se conseguir evitar balanço', 'Controle a descida'],
  },
  'Rollout com barra': {
    muscle: 'abdômen', equipment: 'barra', kind: 'abdominal', pattern: 'anti_extensao',
    instructions: ['Mesma mecânica do ab wheel com barra anilhada'],
  },
  'Body saw': {
    muscle: 'abdômen', equipment: 'corpo', kind: 'abdominal', pattern: 'anti_extensao',
    instructions: ['Em prancha, deslize para frente e para trás sem perder a retroversão'],
  },
  'Prancha com alavanca progressiva': {
    muscle: 'abdômen', equipment: 'corpo', kind: 'abdominal', pattern: 'anti_extensao',
    instructions: ['Aumente a alavanca (cotovelos à frente) para progredir'],
  },
}

function findOrCreateExercise(ex: {
  name: string
  muscle: string
  equipment: string
  kind: string
  pattern?: string
  secondaryMuscles?: string[]
  instructions?: string[]
}): string {
  const pattern = ex.pattern ? q(ex.pattern) : 'null'
  const secondary = textArray(ex.secondaryMuscles ?? [])
  const instructions = textArray(ex.instructions ?? [])
  return `
  select id into v_ex from exercises where name_pt = ${q(ex.name)} limit 1;
  if v_ex is null then
    insert into exercises (name_pt, muscle_group, equipment, exercise_type, movement_pattern, secondary_muscles, instructions)
    values (${q(ex.name)}, ${q(ex.muscle)}, ${q(ex.equipment)}, ${q(ex.kind)}, ${pattern}, ${secondary}, ${instructions})
    returning id into v_ex;
  else
    update exercises set
      exercise_type = coalesce(${q(ex.kind)}, exercise_type),
      movement_pattern = coalesce(${pattern}, movement_pattern),
      secondary_muscles = coalesce(secondary_muscles, ${secondary})
    where id = v_ex;
  end if;`
}

function insertWorkoutExercise(ex: RoutineExerciseDef, orderIndex: number): string {
  const lookup = findOrCreateExercise({
    name: ex.name,
    muscle: ex.primaryMuscle,
    equipment: ex.equipment,
    kind: ex.kind,
    pattern: ex.movementPattern,
    secondaryMuscles: ex.secondaryMuscles,
    instructions: ex.guidance,
  })

  const subs = ex.substitutions
    .map((subName, i) => {
      const meta = SUB_CATALOG[subName]
      if (!meta) {
        throw new Error(`Substituição sem metadados de catálogo: ${subName}`)
      }
      return `${findOrCreateExercise({ name: subName, ...meta })}
  insert into workout_exercise_substitutions (workout_exercise_id, exercise_id, order_index)
  values (v_we, v_ex, ${i})
  on conflict (workout_exercise_id, exercise_id) do nothing;`
    })
    .join('\n')

  const perSideNote = ex.perSide ? q('Repetições por lado') : 'null'

  return `${lookup}
  insert into workout_exercises (
    workout_id, exercise_id, order_index, target_sets,
    target_reps_min, target_reps_max, rest_seconds,
    rir_min, rir_max, technique_notes, notes
  ) values (
    v_workout, v_ex, ${orderIndex}, ${ex.sets},
    ${ex.repsMin}, ${ex.repsMax}, ${ex.restSeconds},
    ${ex.rirMin}, ${ex.rirMax}, ${textArray(ex.guidance)}, ${perSideNote}
  ) returning id into v_we;
${subs}`
}

function generate(): string {
  const days = ROTINA_V2.map((day) => {
    const exercises = day.exercises
      .map((ex, i) => insertWorkoutExercise(ex, i))
      .join('\n')
    return `
  -- ------------------------------------------------------------
  -- ${day.name} (${day.letter}) — dia ${day.dayOfWeek}
  -- ------------------------------------------------------------
  insert into workouts (user_id, letter, name, order_index, day_of_week, objective, warmup_note, routine_version)
  values (v_user, ${q(day.letter)}, ${q(day.name)}, ${day.dayOfWeek - 1}, ${day.dayOfWeek}, ${q(day.objective)}, ${q(day.warmupNote)}, ${ROUTINE_VERSION})
  returning id into v_workout;
${exercises}`
  }).join('\n')

  return `-- 0005 — Dados da Rotina v2 (PPL 6 dias) — GERADO por scripts/generate-rotina-v2-sql.ts
-- NÃO EDITE MANUALMENTE: altere lib/routine/rotina-v2.ts e regenere.
--
-- Para cada usuário com a rotina v1 ativa (Push A..Legs B não arquivados):
--   1. backup jsonb em routine_backups
--   2. arquiva os treinos ativos (preserva sessões e set_logs)
--   3. cria a rotina v2 com dias, exercícios, RIR, descanso e substituições
--
-- Rollback (down): ver bloco comentado no fim do arquivo.

do $$
declare
  v_user uuid;
  v_workout uuid;
  v_ex uuid;
  v_we uuid;
begin
  for v_user in
    select distinct user_id from workouts
    where is_archived = false
      and routine_version < ${ROUTINE_VERSION}
      and name in ('Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B')
  loop
    -- 1. Backup da ficha ativa
    insert into routine_backups (user_id, label, payload)
    select v_user, 'pre-rotina-v${ROUTINE_VERSION}',
      jsonb_build_object(
        'workouts',
        (
          select jsonb_agg(
            to_jsonb(w) || jsonb_build_object(
              'workout_exercises',
              (
                select coalesce(jsonb_agg(to_jsonb(we) order by we.order_index), '[]'::jsonb)
                from workout_exercises we where we.workout_id = w.id
              )
            )
          )
          from workouts w
          where w.user_id = v_user and w.is_archived = false
        )
      );

    -- 2. Arquivar a rotina anterior (não apaga nada)
    update workouts set is_archived = true
    where user_id = v_user and is_archived = false;
${days}
  end loop;
end $$;

-- ============================================================
-- Rollback (down) — reversível:
--   1. delete from workout_exercise_substitutions where workout_exercise_id in
--        (select id from workout_exercises where workout_id in
--          (select id from workouts where routine_version = ${ROUTINE_VERSION}));
--   2. delete from workout_exercises where workout_id in
--        (select id from workouts where routine_version = ${ROUTINE_VERSION})
--        and id not in (select workout_exercise_id from set_logs);
--   3. delete from workouts where routine_version = ${ROUTINE_VERSION}
--        and id not in (select workout_id from workout_sessions);
--   4. update workouts set is_archived = false
--        where routine_version < ${ROUTINE_VERSION}
--        and id in (select (e->>'id')::uuid from routine_backups rb,
--                   jsonb_array_elements(rb.payload->'workouts') e
--                   where rb.label = 'pre-rotina-v${ROUTINE_VERSION}');
--   (sessões realizadas na v2 são preservadas; por isso os deletes acima
--    excluem registros já referenciados por histórico.)
-- ============================================================
`
}

const out = path.resolve(__dirname, '../supabase/migrations/0005_rotina_v2_data.sql')
writeFileSync(out, generate())
console.log(`✅ Migration gerada: ${out}`)
