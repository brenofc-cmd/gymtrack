export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
        }
        Relationships: []
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          letter: string
          name: string
          notes: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          letter: string
          name: string
          notes?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          letter?: string
          name?: string
          notes?: string | null
          order_index?: number
          created_at?: string
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
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
export type SetLog = Database['public']['Tables']['set_logs']['Row']

export type WorkoutLetter = 'A' | 'B' | 'C' | 'D' | 'E'

export type WorkoutExerciseWithExercise = WorkoutExercise & {
  exercise: Exercise
}

export type WorkoutWithExercises = Workout & {
  workout_exercises: WorkoutExerciseWithExercise[]
}

export type SessionWithWorkout = WorkoutSession & {
  workout: Workout
}
