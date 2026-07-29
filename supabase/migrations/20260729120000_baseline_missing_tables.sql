-- 20260729120000 — Baseline das tabelas criadas fora de migration
--
-- Estas 14 tabelas existem em produção (criadas via Dashboard) e são usadas
-- pelo código e tipadas em types/database.ts, mas não tinham migration — o
-- repositório não reconstruía o banco. Esta migration as define conforme os
-- tipos declarados, com RLS e políticas por dono. Em produção tudo aqui é
-- no-op estrutural (create table if not exists); as políticas são recriadas
-- de forma idempotente (drop policy if exists antes de cada create policy).
--
-- Nota sobre tipos numéricos: types/database.ts declara apenas `number`;
-- medidas/doses/macros usam numeric, contagens/minutos/ml usam integer e
-- escalas 1–5 usam smallint. Em produção os tipos já existentes prevalecem.
--
-- Rollback seguro (apenas para ambientes novos; NUNCA executar em produção):
--   drop table if exists public.recipe_ingredients;
--   drop table if exists public.recipes;
--   drop table if exists public.meal_entries;
--   drop table if exists public.meals;
--   drop table if exists public.food_items;
--   drop table if exists public.supplement_logs;
--   drop table if exists public.supplements;
--   drop table if exists public.nutrition_goals;
--   drop table if exists public.hydration_logs;
--   drop table if exists public.body_measurements;
--   drop table if exists public.body_weight_logs;
--   drop table if exists public.sleep_logs;
--   drop table if exists public.recovery_logs;
--   drop table if exists public.user_preferences;

-- ---------------------------------------------------------------------------
-- Corpo e bem-estar
-- ---------------------------------------------------------------------------

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  neck_cm numeric,
  shoulders_cm numeric,
  chest_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  arm_left_cm numeric,
  arm_right_cm numeric,
  thigh_left_cm numeric,
  thigh_right_cm numeric,
  calf_cm numeric,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.body_weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  weight_kg numeric not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  night_of date not null default current_date,
  slept_at timestamptz,
  woke_at timestamptz,
  duration_minutes integer,
  quality smallint,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.recovery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  fatigue smallint,
  soreness smallint,
  stress smallint,
  motivation smallint,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  logged_at timestamptz default now(),
  amount_ml integer not null
);

-- ---------------------------------------------------------------------------
-- Alimentação
-- ---------------------------------------------------------------------------

create table if not exists public.nutrition_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  is_auto boolean not null default true,
  calories_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  water_ml integer,
  weekly_weight_goal_kg numeric,
  sex text,
  age integer,
  height_cm numeric,
  activity_level text,
  training_time text,
  meals_per_day integer,
  eats_where text,
  budget text,
  allergies text[],
  intolerances text[],
  dislikes text[],
  preferences jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Catálogo: user_id null = item global somente leitura; com user_id = do dono.
create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  serving_desc text,
  serving_grams numeric,
  source text,
  is_favorite boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_date date not null default current_date,
  meal_type text,
  name text,
  note text,
  eaten_at timestamptz,
  created_at timestamptz default now()
);

-- Sem user_id próprio: o dono é o dono da refeição (meals.user_id).
create table if not exists public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  food_item_id uuid references public.food_items(id) on delete set null,
  custom_name text,
  quantity numeric not null default 1,
  unit text not null default 'g',
  kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  created_at timestamptz default now()
);

-- Catálogo: user_id null = receita global somente leitura.
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  prep_minutes integer,
  servings integer,
  est_kcal numeric,
  est_protein_g numeric,
  est_carbs_g numeric,
  est_fat_g numeric,
  steps text[],
  substitutions text,
  tags text[],
  is_favorite boolean not null default false,
  created_at timestamptz default now()
);

-- Sem user_id próprio: o dono é o dono da receita (recipes.user_id).
create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null,
  quantity text,
  note text,
  order_index integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Suplementos
-- ---------------------------------------------------------------------------

-- Catálogo: user_id null = suplemento global somente leitura.
create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text,
  default_dose numeric,
  dose_unit text,
  info text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplement_id uuid references public.supplements(id) on delete set null,
  taken_on date not null default current_date,
  taken_at timestamptz default now(),
  dose numeric,
  dose_unit text
);

-- ---------------------------------------------------------------------------
-- Preferências (1 linha por usuário, id = auth.uid(), como user_profiles)
-- ---------------------------------------------------------------------------

create table if not exists public.user_preferences (
  id uuid primary key references auth.users(id) on delete cascade,
  onboarding_done boolean not null default false,
  rest_timer_sound boolean not null default true,
  rest_timer_vibrate boolean not null default true,
  sleep_goal_minutes integer,
  water_goal_ml integer,
  weight_unit text,
  theme text,
  extra jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Índices (FKs usadas em filtro)
-- ---------------------------------------------------------------------------

create index if not exists body_measurements_user_date_idx on public.body_measurements(user_id, logged_on desc);
create index if not exists body_weight_logs_user_date_idx on public.body_weight_logs(user_id, logged_on desc);
create index if not exists sleep_logs_user_night_idx on public.sleep_logs(user_id, night_of desc);
create index if not exists recovery_logs_user_date_idx on public.recovery_logs(user_id, logged_on desc);
create index if not exists hydration_logs_user_date_idx on public.hydration_logs(user_id, logged_on desc);
create index if not exists food_items_user_idx on public.food_items(user_id) where user_id is not null;
create index if not exists meals_user_date_idx on public.meals(user_id, meal_date desc);
create index if not exists meal_entries_meal_idx on public.meal_entries(meal_id);
create index if not exists meal_entries_food_item_idx on public.meal_entries(food_item_id) where food_item_id is not null;
create index if not exists recipes_user_idx on public.recipes(user_id) where user_id is not null;
create index if not exists recipe_ingredients_recipe_idx on public.recipe_ingredients(recipe_id, order_index);
create index if not exists supplements_user_idx on public.supplements(user_id) where user_id is not null;
create index if not exists supplement_logs_user_date_idx on public.supplement_logs(user_id, taken_on desc);
create index if not exists supplement_logs_supplement_idx on public.supplement_logs(supplement_id) where supplement_id is not null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.body_measurements enable row level security;
alter table public.body_weight_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.recovery_logs enable row level security;
alter table public.hydration_logs enable row level security;
alter table public.nutrition_goals enable row level security;
alter table public.food_items enable row level security;
alter table public.meals enable row level security;
alter table public.meal_entries enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.supplements enable row level security;
alter table public.supplement_logs enable row level security;
alter table public.user_preferences enable row level security;

-- Tabelas por dono (user_id = auth.uid())

drop policy if exists "body measurements select own" on public.body_measurements;
create policy "body measurements select own" on public.body_measurements for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "body measurements insert own" on public.body_measurements;
create policy "body measurements insert own" on public.body_measurements for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "body measurements update own" on public.body_measurements;
create policy "body measurements update own" on public.body_measurements for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "body measurements delete own" on public.body_measurements;
create policy "body measurements delete own" on public.body_measurements for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "body weight select own" on public.body_weight_logs;
create policy "body weight select own" on public.body_weight_logs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "body weight insert own" on public.body_weight_logs;
create policy "body weight insert own" on public.body_weight_logs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "body weight update own" on public.body_weight_logs;
create policy "body weight update own" on public.body_weight_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "body weight delete own" on public.body_weight_logs;
create policy "body weight delete own" on public.body_weight_logs for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "sleep logs select own" on public.sleep_logs;
create policy "sleep logs select own" on public.sleep_logs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "sleep logs insert own" on public.sleep_logs;
create policy "sleep logs insert own" on public.sleep_logs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "sleep logs update own" on public.sleep_logs;
create policy "sleep logs update own" on public.sleep_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "sleep logs delete own" on public.sleep_logs;
create policy "sleep logs delete own" on public.sleep_logs for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "recovery logs select own" on public.recovery_logs;
create policy "recovery logs select own" on public.recovery_logs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "recovery logs insert own" on public.recovery_logs;
create policy "recovery logs insert own" on public.recovery_logs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "recovery logs update own" on public.recovery_logs;
create policy "recovery logs update own" on public.recovery_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "recovery logs delete own" on public.recovery_logs;
create policy "recovery logs delete own" on public.recovery_logs for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "hydration select own" on public.hydration_logs;
create policy "hydration select own" on public.hydration_logs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "hydration insert own" on public.hydration_logs;
create policy "hydration insert own" on public.hydration_logs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "hydration update own" on public.hydration_logs;
create policy "hydration update own" on public.hydration_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "hydration delete own" on public.hydration_logs;
create policy "hydration delete own" on public.hydration_logs for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "nutrition goals select own" on public.nutrition_goals;
create policy "nutrition goals select own" on public.nutrition_goals for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "nutrition goals insert own" on public.nutrition_goals;
create policy "nutrition goals insert own" on public.nutrition_goals for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "nutrition goals update own" on public.nutrition_goals;
create policy "nutrition goals update own" on public.nutrition_goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "nutrition goals delete own" on public.nutrition_goals;
create policy "nutrition goals delete own" on public.nutrition_goals for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "meals select own" on public.meals;
create policy "meals select own" on public.meals for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "meals insert own" on public.meals;
create policy "meals insert own" on public.meals for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "meals update own" on public.meals;
create policy "meals update own" on public.meals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "meals delete own" on public.meals;
create policy "meals delete own" on public.meals for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "supplement logs select own" on public.supplement_logs;
create policy "supplement logs select own" on public.supplement_logs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "supplement logs insert own" on public.supplement_logs;
create policy "supplement logs insert own" on public.supplement_logs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "supplement logs update own" on public.supplement_logs;
create policy "supplement logs update own" on public.supplement_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "supplement logs delete own" on public.supplement_logs;
create policy "supplement logs delete own" on public.supplement_logs for delete to authenticated using ((select auth.uid()) = user_id);

-- Catálogos (user_id null = global somente leitura; escrita apenas do dono)

drop policy if exists "food items select catalog or own" on public.food_items;
create policy "food items select catalog or own" on public.food_items for select to authenticated using (user_id is null or (select auth.uid()) = user_id);
drop policy if exists "food items insert own" on public.food_items;
create policy "food items insert own" on public.food_items for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "food items update own" on public.food_items;
create policy "food items update own" on public.food_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "food items delete own" on public.food_items;
create policy "food items delete own" on public.food_items for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "recipes select catalog or own" on public.recipes;
create policy "recipes select catalog or own" on public.recipes for select to authenticated using (user_id is null or (select auth.uid()) = user_id);
drop policy if exists "recipes insert own" on public.recipes;
create policy "recipes insert own" on public.recipes for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "recipes update own" on public.recipes;
create policy "recipes update own" on public.recipes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "recipes delete own" on public.recipes;
create policy "recipes delete own" on public.recipes for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "supplements select catalog or own" on public.supplements;
create policy "supplements select catalog or own" on public.supplements for select to authenticated using (user_id is null or (select auth.uid()) = user_id);
drop policy if exists "supplements insert own" on public.supplements;
create policy "supplements insert own" on public.supplements for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "supplements update own" on public.supplements;
create policy "supplements update own" on public.supplements for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "supplements delete own" on public.supplements;
create policy "supplements delete own" on public.supplements for delete to authenticated using ((select auth.uid()) = user_id);

-- Tabelas-filhas (dono herdado do pai)

drop policy if exists "meal entries select own" on public.meal_entries;
create policy "meal entries select own" on public.meal_entries for select to authenticated using (
  exists (select 1 from public.meals m where m.id = meal_id and m.user_id = (select auth.uid()))
);
drop policy if exists "meal entries insert own" on public.meal_entries;
create policy "meal entries insert own" on public.meal_entries for insert to authenticated with check (
  exists (select 1 from public.meals m where m.id = meal_id and m.user_id = (select auth.uid()))
);
drop policy if exists "meal entries update own" on public.meal_entries;
create policy "meal entries update own" on public.meal_entries for update to authenticated using (
  exists (select 1 from public.meals m where m.id = meal_id and m.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.meals m where m.id = meal_id and m.user_id = (select auth.uid()))
);
drop policy if exists "meal entries delete own" on public.meal_entries;
create policy "meal entries delete own" on public.meal_entries for delete to authenticated using (
  exists (select 1 from public.meals m where m.id = meal_id and m.user_id = (select auth.uid()))
);

drop policy if exists "recipe ingredients select catalog or own" on public.recipe_ingredients;
create policy "recipe ingredients select catalog or own" on public.recipe_ingredients for select to authenticated using (
  exists (select 1 from public.recipes r where r.id = recipe_id and (r.user_id is null or r.user_id = (select auth.uid())))
);
drop policy if exists "recipe ingredients insert own" on public.recipe_ingredients;
create policy "recipe ingredients insert own" on public.recipe_ingredients for insert to authenticated with check (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = (select auth.uid()))
);
drop policy if exists "recipe ingredients update own" on public.recipe_ingredients;
create policy "recipe ingredients update own" on public.recipe_ingredients for update to authenticated using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = (select auth.uid()))
);
drop policy if exists "recipe ingredients delete own" on public.recipe_ingredients;
create policy "recipe ingredients delete own" on public.recipe_ingredients for delete to authenticated using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = (select auth.uid()))
);

-- Preferências (1 linha por usuário, id = auth.uid())

drop policy if exists "user preferences select own" on public.user_preferences;
create policy "user preferences select own" on public.user_preferences for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "user preferences insert own" on public.user_preferences;
create policy "user preferences insert own" on public.user_preferences for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "user preferences update own" on public.user_preferences;
create policy "user preferences update own" on public.user_preferences for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "user preferences delete own" on public.user_preferences;
create policy "user preferences delete own" on public.user_preferences for delete to authenticated using ((select auth.uid()) = id);
