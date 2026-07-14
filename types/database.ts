export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
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
      exercises: {
        Row: {
          created_at: string | null
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
        }
        Insert: {
          created_at?: string | null
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
        }
        Update: {
          created_at?: string | null
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
          execution_quality: string | null
          id: string
          is_warmup: boolean
          notes: string | null
          pain_level: string | null
          performed_exercise_id: string | null
          reps: number
          rir: number | null
          rpe: number | null
          session_id: string
          set_number: number
          weight_kg: number | null
          workout_exercise_id: string
        }
        Insert: {
          completed_at?: string | null
          execution_quality?: string | null
          id?: string
          is_warmup?: boolean
          notes?: string | null
          pain_level?: string | null
          performed_exercise_id?: string | null
          reps: number
          rir?: number | null
          rpe?: number | null
          session_id: string
          set_number: number
          weight_kg?: number | null
          workout_exercise_id: string
        }
        Update: {
          completed_at?: string | null
          execution_quality?: string | null
          id?: string
          is_warmup?: boolean
          notes?: string | null
          pain_level?: string | null
          performed_exercise_id?: string | null
          reps?: number
          rir?: number | null
          rpe?: number | null
          session_id?: string
          set_number?: number
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
          created_at: string | null
          exercise_id: string
          id: string
          is_hidden: boolean
          is_priority: boolean
          load_guidance: string | null
          notes: string | null
          order_index: number
          rest_seconds: number
          rir_max: number | null
          rir_min: number | null
          superset_group: number | null
          target_reps_max: number
          target_reps_min: number
          target_sets: number
          technique_notes: string[] | null
          user_note: string | null
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          is_hidden?: boolean
          is_priority?: boolean
          load_guidance?: string | null
          notes?: string | null
          order_index: number
          rest_seconds: number
          rir_max?: number | null
          rir_min?: number | null
          superset_group?: number | null
          target_reps_max: number
          target_reps_min: number
          target_sets: number
          technique_notes?: string[] | null
          user_note?: string | null
          workout_id: string
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          is_hidden?: boolean
          is_priority?: boolean
          load_guidance?: string | null
          notes?: string | null
          order_index?: number
          rest_seconds?: number
          rir_max?: number | null
          rir_min?: number | null
          superset_group?: number | null
          target_reps_max?: number
          target_reps_min?: number
          target_sets?: number
          technique_notes?: string[] | null
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
      [_ in never]: never
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
export type MovementPattern = 'flexao_tronco' | 'retroversao_pelvica' | 'anti_extensao'
export type PainLevel = 'nenhuma' | 'leve' | 'moderada' | 'forte'
export type ExecutionQuality = 'boa' | 'aceitavel' | 'ruim'
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
