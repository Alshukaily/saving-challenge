import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, 'saving_challenge.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable Foreign Keys & Write-Ahead Logging for speed & durability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize Tables
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT DEFAULT 'تحدي التوفير الرقمي',
      target_amount REAL NOT NULL,
      box_count INTEGER NOT NULL,
      max_per_box REAL NOT NULL,
      distribution_type TEXT DEFAULT 'random',
      pending_box_id INTEGER DEFAULT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS boxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id INTEGER NOT NULL,
      box_number INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'completed'
      completed_at DATETIME DEFAULT NULL,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ SQLite Database Initialized Successfully at:', dbPath);
}

export default db;
