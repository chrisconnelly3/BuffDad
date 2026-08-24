import Database from 'better-sqlite3'

export type Db = Database.Database

export function openDb(path: string): Db {
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY, template_key TEXT NOT NULL,
      started_at TEXT NOT NULL, finished_at TEXT NOT NULL,
      feel_rating TEXT, note TEXT
    );
    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY, workout_id TEXT NOT NULL REFERENCES workouts(id),
      exercise_key TEXT NOT NULL, sets INTEGER NOT NULL, reps INTEGER NOT NULL, weight REAL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, workout_id TEXT NOT NULL REFERENCES workouts(id),
      body TEXT NOT NULL, created_at TEXT NOT NULL, read_at TEXT
    );
    CREATE TABLE IF NOT EXISTS push_subs (
      id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK (role IN ('dad','coach')),
      subscription TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `)
  return db
}
