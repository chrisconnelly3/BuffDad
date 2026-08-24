export type WorkoutSet = { id: string; exercise_key: string; sets: number; reps: number; weight: number | null }
export type Workout = {
  id: string; template_key: string; started_at: string; finished_at: string;
  feel_rating: 'easy' | 'right' | 'rough' | null; note: string | null; sets: WorkoutSet[]
}
export type Message = { id: string; workout_id: string; body: string; created_at: string; read_at: string | null }
