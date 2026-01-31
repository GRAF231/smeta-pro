import Database, { Database as DatabaseType, Statement } from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'smeta.db')
export const db: DatabaseType = new Database(dbPath)

// Initialize database tables immediately
function createTables() {
  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'brigadir' CHECK(role IN ('brigadir', 'customer', 'master')),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Create estimates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS estimates (
      id TEXT PRIMARY KEY,
      brigadir_id TEXT NOT NULL,
      google_sheet_id TEXT NOT NULL,
      title TEXT NOT NULL,
      customer_link_token TEXT UNIQUE NOT NULL,
      master_link_token TEXT UNIQUE NOT NULL,
      column_mapping TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (brigadir_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create estimate_access table
  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_access (
      id TEXT PRIMARY KEY,
      estimate_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'master')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_estimates_brigadir ON estimates(brigadir_id);
    CREATE INDEX IF NOT EXISTS idx_estimates_customer_token ON estimates(customer_link_token);
    CREATE INDEX IF NOT EXISTS idx_estimates_master_token ON estimates(master_link_token);
    CREATE INDEX IF NOT EXISTS idx_access_estimate ON estimate_access(estimate_id);
  `)
}

// Create tables before preparing statements
createTables()

export function initDatabase() {
  console.log('✅ Database initialized')
}

// User queries - created AFTER tables exist
export const userQueries: Record<string, Statement> = {
  findByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  findById: db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?'),
  create: db.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'),
}

// Estimate queries
export const estimateQueries: Record<string, Statement> = {
  findByBrigadirId: db.prepare('SELECT * FROM estimates WHERE brigadir_id = ? ORDER BY created_at DESC'),
  findById: db.prepare('SELECT * FROM estimates WHERE id = ?'),
  findByCustomerToken: db.prepare('SELECT * FROM estimates WHERE customer_link_token = ?'),
  findByMasterToken: db.prepare('SELECT * FROM estimates WHERE master_link_token = ?'),
  create: db.prepare(`
    INSERT INTO estimates (id, brigadir_id, google_sheet_id, title, customer_link_token, master_link_token, column_mapping)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE estimates SET google_sheet_id = ?, title = ? WHERE id = ? AND brigadir_id = ?
  `),
  delete: db.prepare('DELETE FROM estimates WHERE id = ? AND brigadir_id = ?'),
}
