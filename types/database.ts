export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ExerciseType = 'composto' | 'isolador' | 'abdominal'
export type MovementPattern = 'flexao_tronco' | 'retroversao_pelvica' | 'anti_extensao'
export type PainLevel = 'nenhuma' | 'leve' | 'moderada' | 'forte'
export type ExecutionQuality = 'boa' | 'aceitavel' | 'ruim'

export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string
          name_pt: string
          name_en: string | null
          exercisedb_id: string | null
          gif_url: string | null
          muscle_group: string
          equipment: string | null
          instructions: string[] | null
          created_at: string
          exercise_type: ExerciseType | null
          secondary_muscles: string[] | null
          load_guidance: string | null
          movement_pattern: MovementPattern | null
        }
        Insert: {
          id?: string
          name_pt: string
          name_en?: string | null
          exercisedb_id?: string | null
          gif_url?: string | null
          muscle_group: string
          equipment?: string | null
          instructions?: string[] | null
          created_at?: string
          exercise_type?: ExerciseType | null
          secondary_muscles?: string[] | null
          load_guidance?: string | null
          movement_pattern?: MovementPattern | null
        }
        Update: {
          id?: string
          name_pt?: string
          name_en?: string | null
          exercisedb_id?: string | null
          gif_url?: string | null
          muscle_group?: string
          equipment?: string | null
          instructions?: string[] | null
          created_at?: string
          exercise_type?: ExerciseType | null
          secondary_muscles?: string[] | null
          load_guidance?: string | null
          movement_pattern?: MovementPattern | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          letter: string | null
          name: string
          notes: string | null
          order_index: number
          created_at: string
          is_daily: boolean
          day_of_week: number | null
          objective: string | null
          warmup_note: string | null
          is_archived: boolean
          routine_version: number
        }
        Insert: {
          id?: string
          user_id: string
          letter?: string | null
          name: string
          notes?: string | null
          order_index?: number
          created_at?: string
          is_daily?: boolean
          day_of_week?: number | null
          objective?: string | null
          warmup_note?: string | null
          is_archived?: boolean
          routine_version?: number
        }
        Update: {
          id?: string
          user_id?: string
          letter?: string | null
          name?: string
          notes?: string | null
          order_index?: number
          created_at?: string
          is_daily?: boolean
          day_of_week?: number | null
          objective?: string | null
          warmup_note?: string | null
          is_archived?: boolean
          routine_version?: number
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          order_index: number
          target_sets: number
          target_reps_min: number
          target_reps_max: number
          rest_seconds: number
          notes: string | null
          created_at: string
          is_priority: boolean
          is_hidden: boolean
          user_note: string | null
          superset_group: number | null
          rir_min: number | null
          rir_max: number | null
          load_guidance: string | null
          technique_notes: string[] | null
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          order_index: number
          target_sets: number
          target_reps_min: number
          target_reps_max: number
          rest_seconds: number
          notes?: string | null
          created_at?: string
          is_priority?: boolean
          is_hidden?: boolean
          user_note?: string | null
          superset_group?: number | null
          rir_min?: number | null
          rir_max?: number | null
          load_guidance?: string | null
          technique_notes?: string[] | null
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          order_index?: number
          target_sets?: number
          target_reps_min?: number
          target_reps_max?: number
          rest_seconds?: number
          notes?: string | null
          created_at?: string
          is_priority?: boolean
          is_hidden?: boolean
          user_note?: string | null
          superset_group?: number | null
          rir_min?: number | null
          rir_max?: number | null
          load_guidance?: string | null
          technique_notes?: string[] | null
        }
        Relationships: []
      }
      workout_exercise_substitutions: {
        Row: {
          id: string
          workout_exercise_id: string
          exercise_id: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          workout_exercise_id: string
          exercise_id: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          workout_exercise_id?: string
          exercise_id?: string
          order_index?: number
          created_at?: string
        }
        Relationships: []
      }
      routine_backups: {
        Row: {
          id: string
          user_id: string
          label: string
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          payload: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          payload?: Json
          created_at?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          started_at: string
          finished_at: string | null
          duration_seconds: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_id: string
          started_at?: string
          finished_at?: string | null
          duration_seconds?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          started_at?: string
          finished_at?: string | null
          duration_seconds?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      set_logs: {
        Row: {
          id: string
          session_id: string
          workout_exercise_id: string
          set_number: number
          weight_kg: number | null
          reps: number
          rpe: number | null
          completed_at: string
          notes: string | null
          rir: number | null
          is_warmup: boolean
          pain_level: PainLevel | null
          execution_quality: ExecutionQuality | null
          performed_exercise_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          workout_exercise_id: string
          set_number: number
          weight_kg?: number | null
          reps: number
          rpe?: number | null
          completed_at?: string
          notes?: string | null
          rir?: number | null
          is_warmup?: boolean
          pain_level?: PainLevel | null
          execution_quality?: ExecutionQuality | null
          performed_exercise_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          workout_exercise_id?: string
          set_number?: number
          weight_kg?: number | null
          reps?: number
          rpe?: number | null
          completed_at?: string
          notes?: string | null
          rir?: number | null
          is_warmup?: boolean
          pain_level?: PainLevel | null
          execution_quality?: ExecutionQuality | null
          performed_exercise_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          weight_kg: number | null
          weekly_goal: number | null
          updated_at: string | null
          height_cm: number | null
          birth_date: string | null
          sex: string | null
          goal: string | null
          program_start_date: string | null
        }
        Insert: {
          id: string
          weight_kg?: number | null
          weekly_goal?: number | null
          updated_at?: string | null
          height_cm?: number | null
          birth_date?: string | null
          sex?: string | null
          goal?: string | null
          program_start_date?: string | null
        }
        Update: {
          id?: string
          weight_kg?: number | null
          weekly_goal?: number | null
          updated_at?: string | null
          height_cm?: number | null
          birth_date?: string | null
          sex?: string | null
          goal?: string | null
          program_start_date?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience types
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type Workout = Database['public']['Tables']['workouts']['Row']
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row']
export type WorkoutExerciseSubstitution =
  Database['public']['Tables']['workout_exercise_substitutions']['Row']
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
export type SetLog = Database['public']['Tables']['set_logs']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export type WorkoutLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export type SubstitutionWithExercise = WorkoutExerciseSubstitution & {
  exercise: Exercise
}

export type WorkoutExerciseWithExercise = WorkoutExercise & {
  exercise: Exercise
  substitutions?: SubstitutionWithExercise[]
}

export type WorkoutWithExercises = Workout & {
  workout_exercises: WorkoutExerciseWithExercise[]
}

export type SessionWithWorkout = WorkoutSession & {
  workout: Workout
}
