export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DailyCoreSessionType = 'hipertrofia' | 'estabilidade' | 'recuperacao' | 'descanso'
export type DailyCoreIntensity = 'moderada' | 'leve' | 'muito_leve' | 'descanso'
export type DailyCoreMeasureType = 'repeticoes' | 'tempo' | 'respiracoes'
export type DailyCoreStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'interrompido'
export type DailyCoreCompletionKind = 'treino' | 'recuperacao_completa' | 'descanso' | 'pausa_por_dor'
export type DailyCoreExecutionQuality = 'excelente' | 'boa' | 'aceitavel' | 'ruim'
export type DailyCorePainLevel = 'sem_dor' | 'desconforto_leve' | 'dor_moderada' | 'dor_forte' | 'dor_lombar'
export type DailyCorePainCheck = 'sem_dor' | 'dor_muscular_leve' | 'dor_muscular_moderada' | 'dor_forte' | 'dor_lombar'

export type DailyCoreDayRow = {
  day_of_week: number
  name: string
  objective: string
  session_type: DailyCoreSessionType
  intensity: DailyCoreIntensity
  duration_min: number
  duration_max: number
  is_rest: boolean
  educational_note: string
  created_at: string
  updated_at: string
}

export type DailyCoreExerciseRow = {
  id: string
  slug: string
  day_of_week: number
  name: string
  objective: string
  exercise_type: string
  measure_type: DailyCoreMeasureType
  target_sets: number
  target_reps_min: number | null
  target_reps_max: number | null
  target_seconds_min: number | null
  target_seconds_max: number | null
  per_side: boolean
  rir_min: number | null
  rir_max: number | null
  rest_seconds_min: number
  rest_seconds_max: number
  primary_muscle: string
  equipment: string | null
  short_cue: string
  instructions: string[]
  progression_rule: string
  order_index: number
  created_at: string
  updated_at: string
}

export type DailyCoreVariationRow = {
  id: string
  exercise_id: string
  name: string
  difficulty: number
  equipment_required: string | null
  is_default: boolean
  is_equipment_fallback: boolean
  order_index: number
  created_at: string
}

export type DailyCorePreferenceRow = {
  user_id: string
  has_ab_wheel: boolean
  has_resistance_band: boolean
  has_weighted_backpack: boolean
  manual_rep_count: boolean
  routine_time: string
  adaptation_started_on: string
  skip_adaptation: boolean
  onboarding_completed_at: string | null
  created_at: string
  updated_at: string
}

export type DailyCoreReminderRow = {
  user_id: string
  enabled: boolean
  reminder_time: string
  weekdays: number[]
  sound_enabled: boolean
  vibration_enabled: boolean
  snoozed_until: string | null
  disabled_until: string | null
  last_notified_on: string | null
  created_at: string
  updated_at: string
}

export type DailyCoreSessionRow = {
  id: string
  user_id: string
  day_of_week: number
  session_date: string
  session_type: DailyCoreSessionType
  status: DailyCoreStatus
  completion_kind: DailyCoreCompletionKind | null
  adaptation_week: number
  started_at: string | null
  finished_at: string | null
  duration_seconds: number | null
  client_updated_at: string
  created_at: string
  updated_at: string
}

export type DailyCoreSetRow = {
  id: string
  session_id: string
  user_id: string
  exercise_id: string
  variation_id: string | null
  set_number: number
  reps: number | null
  duration_seconds: number | null
  weight_kg: number | null
  rir: number | null
  execution_quality: DailyCoreExecutionQuality | null
  pain_level: DailyCorePainLevel | null
  lumbar_controlled: boolean | null
  notes: string | null
  completed_at: string
  client_updated_at: string
  created_at: string
  updated_at: string
}

export type DailyCoreProgressionRow = {
  id: string
  user_id: string
  exercise_id: string
  current_variation_id: string | null
  suggested_variation_id: string | null
  suggested_reps: number | null
  suggested_seconds: number | null
  suggested_weight_kg: number | null
  status: 'manter' | 'progredir' | 'bloqueada_por_dor' | 'revisar_tecnica'
  reason: string
  created_at: string
  updated_at: string
}

export type DailyCorePainLogRow = {
  id: string
  user_id: string
  session_id: string | null
  exercise_id: string | null
  logged_on: string
  pain_level: DailyCorePainCheck
  notes: string | null
  created_at: string
  updated_at: string
}

export type DailyCoreConflictRow = {
  id: string
  user_id: string
  workout_exercise_id: string
  was_hidden: boolean
  reason: string
  created_at: string
}

type DbTable<Row, Insert, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_core_days: DbTable<
        DailyCoreDayRow,
        Omit<DailyCoreDayRow, 'created_at' | 'updated_at'> & Partial<Pick<DailyCoreDayRow, 'created_at' | 'updated_at'>>
      >
      daily_core_exercises: DbTable<
        DailyCoreExerciseRow,
        Omit<DailyCoreExerciseRow, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<DailyCoreExerciseRow, 'id' | 'created_at' | 'updated_at'>>
      >
      daily_core_variations: DbTable<
        DailyCoreVariationRow,
        Omit<DailyCoreVariationRow, 'id' | 'created_at'> & Partial<Pick<DailyCoreVariationRow, 'id' | 'created_at'>>
      >
      daily_core_preferences: DbTable<
        DailyCorePreferenceRow,
        Pick<DailyCorePreferenceRow, 'user_id'> & Partial<Omit<DailyCorePreferenceRow, 'user_id'>>
      >
      daily_core_reminders: DbTable<
        DailyCoreReminderRow,
        Pick<DailyCoreReminderRow, 'user_id'> & Partial<Omit<DailyCoreReminderRow, 'user_id'>>
      >
      daily_core_sessions: DbTable<
        DailyCoreSessionRow,
        Pick<DailyCoreSessionRow, 'user_id' | 'day_of_week' | 'session_date' | 'session_type'> & Partial<Omit<DailyCoreSessionRow, 'user_id' | 'day_of_week' | 'session_date' | 'session_type'>>
      >
      daily_core_sets: DbTable<
        DailyCoreSetRow,
        Pick<DailyCoreSetRow, 'session_id' | 'user_id' | 'exercise_id' | 'set_number'> & Partial<Omit<DailyCoreSetRow, 'session_id' | 'user_id' | 'exercise_id' | 'set_number'>>
      >
      daily_core_progressions: DbTable<
        DailyCoreProgressionRow,
        Pick<DailyCoreProgressionRow, 'user_id' | 'exercise_id'> & Partial<Omit<DailyCoreProgressionRow, 'user_id' | 'exercise_id'>>
      >
      daily_core_pain_logs: DbTable<
        DailyCorePainLogRow,
        Pick<DailyCorePainLogRow, 'user_id' | 'pain_level'> & Partial<Omit<DailyCorePainLogRow, 'user_id' | 'pain_level'>>
      >
      daily_core_main_exercise_conflicts: DbTable<
        DailyCoreConflictRow,
        Omit<DailyCoreConflictRow, 'id' | 'created_at'> & Partial<Pick<DailyCoreConflictRow, 'id' | 'created_at'>>
      >
      body_measurements: {
        Row: {
          arm_left_cm: number | null
          arm_right_cm: number | null
          calf_cm: number | null
          chest_cm: number | null
          created_at: string | null
          hips_cm: number | null
          id: string
          logged_on: string
          neck_cm: number | null
          note: string | null
          shoulders_cm: number | null
          thigh_left_cm: number | null
          thigh_right_cm: number | null
          user_id: string
          waist_cm: number | null
        }
        Insert: {
          arm_left_cm?: number | null
          arm_right_cm?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string | null
          hips_cm?: number | null
          id?: string
          logged_on?: string
          neck_cm?: number | null
          note?: string | null
          shoulders_cm?: number | null
          thigh_left_cm?: number | null
          thigh_right_cm?: number | null
          user_id: string
          waist_cm?: number | null
        }
        Update: {
          arm_left_cm?: number | null
          arm_right_cm?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string | null
          hips_cm?: number | null
          id?: string
          logged_on?: string
          neck_cm?: number | null
          note?: string | null
          shoulders_cm?: number | null
          thigh_left_cm?: number | null
          thigh_right_cm?: number | null
          user_id?: string
          waist_cm?: number | null
        }
        Relationships: []
      }
      body_weight_logs: {
        Row: {
          created_at: string | null
          id: string
          logged_on: string
          note: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          logged_on?: string
          note?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          id?: string
          logged_on?: string
          note?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      content_sources: {
        Row: { id: string; slug: string; title: string; category: string; provenance: string; url: string | null; summary: string; accessed_on: string; created_at: string }
        Insert: { id?: string; slug: string; title: string; category: string; provenance: string; url?: string | null; summary: string; accessed_on: string; created_at?: string }
        Update: { id?: string; slug?: string; title?: string; category?: string; provenance?: string; url?: string | null; summary?: string; accessed_on?: string; created_at?: string }
        Relationships: []
      }
      daily_readiness: {
        Row: { id: string; user_id: string; readiness_date: string; sleep_quality: number; energy: number; muscle_soreness: number; joint_pain: string; stress: number; motivation: number; recovery_feeling: number; recommendation: string; recommendation_reason: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; readiness_date?: string; sleep_quality: number; energy: number; muscle_soreness: number; joint_pain: string; stress: number; motivation: number; recovery_feeling: number; recommendation: string; recommendation_reason: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; readiness_date?: string; sleep_quality?: number; energy?: number; muscle_soreness?: number; joint_pain?: string; stress?: number; motivation?: number; recovery_feeling?: number; recommendation?: string; recommendation_reason?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string | null
          difficulty_level: string
          equipment: string | null
          exercise_type: string | null
          exercisedb_id: string | null
          gif_url: string | null
          id: string
          instructions: string[] | null
          load_guidance: string | null
          movement_pattern: string | null
          muscle_group: string
          name_en: string | null
          name_pt: string
          secondary_muscles: string[] | null
          risk_level: string
          training_objective: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty_level?: string
          equipment?: string | null
          exercise_type?: string | null
          exercisedb_id?: string | null
          gif_url?: string | null
          id?: string
          instructions?: string[] | null
          load_guidance?: string | null
          movement_pattern?: string | null
          muscle_group: string
          name_en?: string | null
          name_pt: string
          secondary_muscles?: string[] | null
          risk_level?: string
          training_objective?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty_level?: string
          equipment?: string | null
          exercise_type?: string | null
          exercisedb_id?: string | null
          gif_url?: string | null
          id?: string
          instructions?: string[] | null
          load_guidance?: string | null
          movement_pattern?: string | null
          muscle_group?: string
          name_en?: string | null
          name_pt?: string
          secondary_muscles?: string[] | null
          risk_level?: string
          training_objective?: string | null
        }
        Relationships: []
      }
      food_items: {
        Row: {
          brand: string | null
          carbs_g: number | null
          created_at: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          is_favorite: boolean
          kcal: number | null
          name: string
          protein_g: number | null
          serving_desc: string | null
          serving_grams: number | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          carbs_g?: number | null
          created_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          is_favorite?: boolean
          kcal?: number | null
          name: string
          protein_g?: number | null
          serving_desc?: string | null
          serving_grams?: number | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          carbs_g?: number | null
          created_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          is_favorite?: boolean
          kcal?: number | null
          name?: string
          protein_g?: number | null
          serving_desc?: string | null
          serving_grams?: number | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      hydration_logs: {
        Row: {
          amount_ml: number
          id: string
          logged_at: string | null
          logged_on: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          id?: string
          logged_at?: string | null
          logged_on?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          id?: string
          logged_at?: string | null
          logged_on?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          carbs_g: number | null
          created_at: string | null
          custom_name: string | null
          fat_g: number | null
          fiber_g: number | null
          food_item_id: string | null
          id: string
          kcal: number | null
          meal_id: string
          protein_g: number | null
          quantity: number
          unit: string
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string | null
          custom_name?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_item_id?: string | null
          id?: string
          kcal?: number | null
          meal_id: string
          protein_g?: number | null
          quantity?: number
          unit?: string
        }
        Update: {
          carbs_g?: number | null
          created_at?: string | null
          custom_name?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_item_id?: string | null
          id?: string
          kcal?: number | null
          meal_id?: string
          protein_g?: number | null
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_entries_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string | null
          eaten_at: string | null
          id: string
          meal_date: string
          meal_type: string | null
          name: string | null
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          eaten_at?: string | null
          id?: string
          meal_date?: string
          meal_type?: string | null
          name?: string | null
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          eaten_at?: string | null
          id?: string
          meal_date?: string
          meal_type?: string | null
          name?: string | null
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          budget: string | null
          calories_kcal: number | null
          carbs_g: number | null
          created_at: string | null
          dislikes: string[] | null
          eats_where: string | null
          fat_g: number | null
          fiber_g: number | null
          height_cm: number | null
          id: string
          intolerances: string[] | null
          is_auto: boolean
          meals_per_day: number | null
          preferences: Json | null
          protein_g: number | null
          sex: string | null
          training_time: string | null
          updated_at: string | null
          user_id: string
          water_ml: number | null
          weekly_weight_goal_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          budget?: string | null
          calories_kcal?: number | null
          carbs_g?: number | null
          created_at?: string | null
          dislikes?: string[] | null
          eats_where?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          height_cm?: number | null
          id?: string
          intolerances?: string[] | null
          is_auto?: boolean
          meals_per_day?: number | null
          preferences?: Json | null
          protein_g?: number | null
          sex?: string | null
          training_time?: string | null
          updated_at?: string | null
          user_id: string
          water_ml?: number | null
          weekly_weight_goal_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          budget?: string | null
          calories_kcal?: number | null
          carbs_g?: number | null
          created_at?: string | null
          dislikes?: string[] | null
          eats_where?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          height_cm?: number | null
          id?: string
          intolerances?: string[] | null
          is_auto?: boolean
          meals_per_day?: number | null
          preferences?: Json | null
          protein_g?: number | null
          sex?: string | null
          training_time?: string | null
          updated_at?: string | null
          user_id?: string
          water_ml?: number | null
          weekly_weight_goal_kg?: number | null
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          id: string
          name: string
          note: string | null
          order_index: number
          quantity: string | null
          recipe_id: string
        }
        Insert: {
          id?: string
          name: string
          note?: string | null
          order_index?: number
          quantity?: string | null
          recipe_id: string
        }
        Update: {
          id?: string
          name?: string
          note?: string | null
          order_index?: number
          quantity?: string | null
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string | null
          description: string | null
          est_carbs_g: number | null
          est_fat_g: number | null
          est_kcal: number | null
          est_protein_g: number | null
          id: string
          is_favorite: boolean
          prep_minutes: number | null
          servings: number | null
          steps: string[] | null
          substitutions: string | null
          tags: string[] | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          est_carbs_g?: number | null
          est_fat_g?: number | null
          est_kcal?: number | null
          est_protein_g?: number | null
          id?: string
          is_favorite?: boolean
          prep_minutes?: number | null
          servings?: number | null
          steps?: string[] | null
          substitutions?: string | null
          tags?: string[] | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          est_carbs_g?: number | null
          est_fat_g?: number | null
          est_kcal?: number | null
          est_protein_g?: number | null
          id?: string
          is_favorite?: boolean
          prep_minutes?: number | null
          servings?: number | null
          steps?: string[] | null
          substitutions?: string | null
          tags?: string[] | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      recovery_logs: {
        Row: {
          created_at: string | null
          fatigue: number | null
          id: string
          logged_on: string
          motivation: number | null
          note: string | null
          soreness: number | null
          stress: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fatigue?: number | null
          id?: string
          logged_on?: string
          motivation?: number | null
          note?: string | null
          soreness?: number | null
          stress?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fatigue?: number | null
          id?: string
          logged_on?: string
          motivation?: number | null
          note?: string | null
          soreness?: number | null
          stress?: number | null
          user_id?: string
        }
        Relationships: []
      }
      routine_backups: {
        Row: {
          created_at: string | null
          id: string
          label: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          payload: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      set_logs: {
        Row: {
          completed_at: string | null
          estimated_1rm: number | null
          execution_quality: string | null
          id: string
          is_warmup: boolean
          notes: string | null
          pain_level: string | null
          performed_exercise_id: string | null
          reps: number
          rir: number | null
          rom_quality: string | null
          rpe: number | null
          session_id: string
          set_number: number
          set_role: string
          weight_kg: number | null
          workout_exercise_id: string
        }
        Insert: {
          completed_at?: string | null
          estimated_1rm?: number | null
          execution_quality?: string | null
          id?: string
          is_warmup?: boolean
          notes?: string | null
          pain_level?: string | null
          performed_exercise_id?: string | null
          reps: number
          rir?: number | null
          rom_quality?: string | null
          rpe?: number | null
          session_id: string
          set_number: number
          set_role?: string
          weight_kg?: number | null
          workout_exercise_id: string
        }
        Update: {
          completed_at?: string | null
          estimated_1rm?: number | null
          execution_quality?: string | null
          id?: string
          is_warmup?: boolean
          notes?: string | null
          pain_level?: string | null
          performed_exercise_id?: string | null
          reps?: number
          rir?: number | null
          rom_quality?: string | null
          rpe?: number | null
          session_id?: string
          set_number?: number
          set_role?: string
          weight_kg?: number | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_performed_exercise_id_fkey"
            columns: ["performed_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_logs: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          night_of: string
          note: string | null
          quality: number | null
          slept_at: string | null
          user_id: string
          woke_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          night_of?: string
          note?: string | null
          quality?: number | null
          slept_at?: string | null
          user_id: string
          woke_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          night_of?: string
          note?: string | null
          quality?: number | null
          slept_at?: string | null
          user_id?: string
          woke_at?: string | null
        }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          dose: number | null
          dose_unit: string | null
          id: string
          supplement_id: string | null
          taken_at: string | null
          taken_on: string
          user_id: string
        }
        Insert: {
          dose?: number | null
          dose_unit?: string | null
          id?: string
          supplement_id?: string | null
          taken_at?: string | null
          taken_on?: string
          user_id: string
        }
        Update: {
          dose?: number | null
          dose_unit?: string | null
          id?: string
          supplement_id?: string | null
          taken_at?: string | null
          taken_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_logs_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements: {
        Row: {
          category: string | null
          created_at: string | null
          default_dose: number | null
          dose_unit: string | null
          id: string
          info: string | null
          is_active: boolean
          name: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_dose?: number | null
          dose_unit?: string | null
          id?: string
          info?: string | null
          is_active?: boolean
          name: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_dose?: number | null
          dose_unit?: string | null
          id?: string
          info?: string | null
          is_active?: boolean
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          extra: Json | null
          id: string
          onboarding_done: boolean
          rest_timer_sound: boolean
          rest_timer_vibrate: boolean
          sleep_goal_minutes: number | null
          theme: string | null
          updated_at: string | null
          water_goal_ml: number | null
          weight_unit: string | null
        }
        Insert: {
          created_at?: string | null
          extra?: Json | null
          id: string
          onboarding_done?: boolean
          rest_timer_sound?: boolean
          rest_timer_vibrate?: boolean
          sleep_goal_minutes?: number | null
          theme?: string | null
          updated_at?: string | null
          water_goal_ml?: number | null
          weight_unit?: string | null
        }
        Update: {
          created_at?: string | null
          extra?: Json | null
          id?: string
          onboarding_done?: boolean
          rest_timer_sound?: boolean
          rest_timer_vibrate?: boolean
          sleep_goal_minutes?: number | null
          theme?: string | null
          updated_at?: string | null
          water_goal_ml?: number | null
          weight_unit?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          birth_date: string | null
          goal: string | null
          height_cm: number | null
          id: string
          program_start_date: string | null
          sex: string | null
          training_phase: string
          updated_at: string | null
          weekly_goal: number | null
          weight_kg: number | null
        }
        Insert: {
          birth_date?: string | null
          goal?: string | null
          height_cm?: number | null
          id: string
          program_start_date?: string | null
          sex?: string | null
          training_phase?: string
          updated_at?: string | null
          weekly_goal?: number | null
          weight_kg?: number | null
        }
        Update: {
          birth_date?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          program_start_date?: string | null
          sex?: string | null
          training_phase?: string
          updated_at?: string | null
          weekly_goal?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      workout_exercise_substitutions: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          order_index: number
          workout_exercise_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          order_index?: number
          workout_exercise_id: string
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          order_index?: number
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercise_substitutions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercise_substitutions_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          aesthetic_function: string | null
          backoff_percentage: number | null
          created_at: string | null
          exercise_id: string
          failure_allowed: boolean
          failure_risk_level: string
          id: string
          is_hidden: boolean
          is_priority: boolean
          load_guidance: string | null
          notes: string | null
          order_index: number
          progression_type: string
          rest_seconds: number
          rir_max: number | null
          rir_min: number | null
          superset_group: number | null
          target_reps_max: number
          target_reps_min: number
          target_sets: number
          technique_notes: string[] | null
          top_set_enabled: boolean
          user_note: string | null
          workout_id: string
        }
        Insert: {
          aesthetic_function?: string | null
          backoff_percentage?: number | null
          created_at?: string | null
          exercise_id: string
          failure_allowed?: boolean
          failure_risk_level?: string
          id?: string
          is_hidden?: boolean
          is_priority?: boolean
          load_guidance?: string | null
          notes?: string | null
          order_index: number
          progression_type?: string
          rest_seconds: number
          rir_max?: number | null
          rir_min?: number | null
          superset_group?: number | null
          target_reps_max: number
          target_reps_min: number
          target_sets: number
          technique_notes?: string[] | null
          top_set_enabled?: boolean
          user_note?: string | null
          workout_id: string
        }
        Update: {
          aesthetic_function?: string | null
          backoff_percentage?: number | null
          created_at?: string | null
          exercise_id?: string
          failure_allowed?: boolean
          failure_risk_level?: string
          id?: string
          is_hidden?: boolean
          is_priority?: boolean
          load_guidance?: string | null
          notes?: string | null
          order_index?: number
          progression_type?: string
          rest_seconds?: number
          rir_max?: number | null
          rir_min?: number | null
          superset_group?: number | null
          target_reps_max?: number
          target_reps_min?: number
          target_sets?: number
          technique_notes?: string[] | null
          top_set_enabled?: boolean
          user_note?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          finished_at: string | null
          id: string
          notes: string | null
          started_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          finished_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          user_id: string
          workout_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          finished_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          id: string
          is_archived: boolean
          is_daily: boolean
          letter: string | null
          name: string
          notes: string | null
          objective: string | null
          order_index: number
          routine_version: number
          session_focus: string
          user_id: string
          warmup_note: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          id?: string
          is_archived?: boolean
          is_daily?: boolean
          letter?: string | null
          name: string
          notes?: string | null
          objective?: string | null
          order_index?: number
          routine_version?: number
          session_focus?: string
          user_id: string
          warmup_note?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          id?: string
          is_archived?: boolean
          is_daily?: boolean
          letter?: string | null
          name?: string
          notes?: string | null
          objective?: string | null
          order_index?: number
          routine_version?: number
          session_focus?: string
          user_id?: string
          warmup_note?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      swap_workout_exercise: {
        Args: {
          p_replacement_exercise_id: string
          p_workout_exercise_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const


export type ExerciseType = 'composto' | 'isolador' | 'abdominal'
export type MovementPattern =
  | 'horizontal_push' | 'incline_push' | 'vertical_push'
  | 'vertical_pull' | 'horizontal_pull' | 'squat' | 'hip_hinge'
  | 'unilateral_leg' | 'knee_flexion' | 'calf_raise'
  | 'lateral_delt' | 'rear_delt' | 'elbow_flexion' | 'elbow_extension'
  | 'trunk_flexion' | 'pelvic_curl' | 'anti_extension' | 'anti_rotation'
  | 'flexao_tronco' | 'retroversao_pelvica' | 'anti_extensao'
export type PainLevel = 'nenhuma' | 'leve' | 'moderada' | 'forte'
export type ExecutionQuality = 'boa' | 'aceitavel' | 'ruim'
export type RomQuality = 'completa' | 'adequada' | 'reduzida'
export type Exercise = Tables<'exercises'>
export type Workout = Tables<'workouts'>
export type WorkoutExercise = Tables<'workout_exercises'>
export type WorkoutExerciseSubstitution = Tables<'workout_exercise_substitutions'>
export type WorkoutSession = Tables<'workout_sessions'>
export type SetLog = Tables<'set_logs'>
export type UserProfile = Tables<'user_profiles'>
export type WorkoutLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type SubstitutionWithExercise = WorkoutExerciseSubstitution & { exercise: Exercise }
export type WorkoutExerciseWithExercise = WorkoutExercise & { exercise: Exercise; substitutions?: SubstitutionWithExercise[] }
export type WorkoutWithExercises = Workout & { workout_exercises: WorkoutExerciseWithExercise[] }
export type SessionWithWorkout = WorkoutSession & { workout: Workout }
