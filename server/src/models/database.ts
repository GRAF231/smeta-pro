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
      last_synced_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (brigadir_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create estimate_sections table (разделы сметы)
  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_sections (
      id TEXT PRIMARY KEY,
      estimate_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      show_customer INTEGER DEFAULT 1,
      show_master INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
    )
  `)

  // Create estimate_items table (позиции сметы)
  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_items (
      id TEXT PRIMARY KEY,
      estimate_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      number TEXT,
      name TEXT NOT NULL,
      unit TEXT,
      quantity REAL DEFAULT 0,
      customer_price REAL DEFAULT 0,
      customer_total REAL DEFAULT 0,
      master_price REAL DEFAULT 0,
      master_total REAL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      show_customer INTEGER DEFAULT 1,
      show_master INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES estimate_sections(id) ON DELETE CASCADE
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

  // Create estimate_versions table (версии смет)
  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_versions (
      id TEXT PRIMARY KEY,
      estimate_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
    )
  `)

  // Create estimate_version_sections table (разделы версии)
  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_version_sections (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      original_section_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      show_customer INTEGER DEFAULT 1,
      show_master INTEGER DEFAULT 1,
      FOREIGN KEY (version_id) REFERENCES estimate_versions(id) ON DELETE CASCADE
    )
  `)

  // Create estimate_version_items table (позиции версии)
  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_version_items (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      version_section_id TEXT NOT NULL,
      original_item_id TEXT NOT NULL,
      number TEXT,
      name TEXT NOT NULL,
      unit TEXT,
      quantity REAL DEFAULT 0,
      customer_price REAL DEFAULT 0,
      customer_total REAL DEFAULT 0,
      master_price REAL DEFAULT 0,
      master_total REAL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      show_customer INTEGER DEFAULT 1,
      show_master INTEGER DEFAULT 1,
      FOREIGN KEY (version_id) REFERENCES estimate_versions(id) ON DELETE CASCADE,
      FOREIGN KEY (version_section_id) REFERENCES estimate_version_sections(id) ON DELETE CASCADE
    )
  `)

  // Create estimate_act_images table (изображения для актов)
  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_act_images (
      id TEXT PRIMARY KEY,
      estimate_id TEXT NOT NULL,
      image_type TEXT NOT NULL CHECK(image_type IN ('logo', 'stamp', 'signature')),
      data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
      UNIQUE(estimate_id, image_type)
    )
  `)

  // Migration: add master_password column if not exists
  const estimateColumns = db.prepare("PRAGMA table_info(estimates)").all() as { name: string }[]
  if (!estimateColumns.some(col => col.name === 'master_password')) {
    db.exec(`ALTER TABLE estimates ADD COLUMN master_password TEXT DEFAULT NULL`)
  }

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_estimates_brigadir ON estimates(brigadir_id);
    CREATE INDEX IF NOT EXISTS idx_estimates_customer_token ON estimates(customer_link_token);
    CREATE INDEX IF NOT EXISTS idx_estimates_master_token ON estimates(master_link_token);
    CREATE INDEX IF NOT EXISTS idx_access_estimate ON estimate_access(estimate_id);
    CREATE INDEX IF NOT EXISTS idx_sections_estimate ON estimate_sections(estimate_id);
    CREATE INDEX IF NOT EXISTS idx_items_estimate ON estimate_items(estimate_id);
    CREATE INDEX IF NOT EXISTS idx_items_section ON estimate_items(section_id);
    CREATE INDEX IF NOT EXISTS idx_versions_estimate ON estimate_versions(estimate_id);
    CREATE INDEX IF NOT EXISTS idx_version_sections_version ON estimate_version_sections(version_id);
    CREATE INDEX IF NOT EXISTS idx_version_items_version ON estimate_version_items(version_id);
    CREATE INDEX IF NOT EXISTS idx_version_items_section ON estimate_version_items(version_section_id);
    CREATE INDEX IF NOT EXISTS idx_act_images_estimate ON estimate_act_images(estimate_id);
  `)
}

// Create tables before preparing statements
createTables()

export function initDatabase() {
  console.log('✅ Database initialized')
}

// User queries
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
  updateMasterPassword: db.prepare(`
    UPDATE estimates SET master_password = ? WHERE id = ? AND brigadir_id = ?
  `),
  updateLastSynced: db.prepare(`
    UPDATE estimates SET last_synced_at = datetime('now') WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM estimates WHERE id = ? AND brigadir_id = ?'),
}

// Section queries
export const sectionQueries: Record<string, Statement> = {
  findByEstimateId: db.prepare('SELECT * FROM estimate_sections WHERE estimate_id = ? ORDER BY sort_order'),
  findById: db.prepare('SELECT * FROM estimate_sections WHERE id = ?'),
  create: db.prepare(`
    INSERT INTO estimate_sections (id, estimate_id, name, sort_order, show_customer, show_master)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE estimate_sections SET name = ?, show_customer = ?, show_master = ? WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM estimate_sections WHERE id = ?'),
  deleteByEstimateId: db.prepare('DELETE FROM estimate_sections WHERE estimate_id = ?'),
}

// Item queries
export const itemQueries: Record<string, Statement> = {
  findByEstimateId: db.prepare(`
    SELECT * FROM estimate_items WHERE estimate_id = ? ORDER BY sort_order
  `),
  findBySectionId: db.prepare(`
    SELECT * FROM estimate_items WHERE section_id = ? ORDER BY sort_order
  `),
  findById: db.prepare('SELECT * FROM estimate_items WHERE id = ?'),
  create: db.prepare(`
    INSERT INTO estimate_items (id, estimate_id, section_id, number, name, unit, quantity, 
      customer_price, customer_total, master_price, master_total, sort_order, show_customer, show_master)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE estimate_items SET 
      name = ?, unit = ?, quantity = ?, 
      customer_price = ?, customer_total = ?, 
      master_price = ?, master_total = ?,
      show_customer = ?, show_master = ?
    WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM estimate_items WHERE id = ?'),
  deleteByEstimateId: db.prepare('DELETE FROM estimate_items WHERE estimate_id = ?'),
}

// Version queries
export const versionQueries: Record<string, Statement> = {
  findByEstimateId: db.prepare(`
    SELECT * FROM estimate_versions WHERE estimate_id = ? ORDER BY version_number DESC
  `),
  findById: db.prepare('SELECT * FROM estimate_versions WHERE id = ?'),
  getMaxVersionNumber: db.prepare(`
    SELECT COALESCE(MAX(version_number), 0) as max_version FROM estimate_versions WHERE estimate_id = ?
  `),
  create: db.prepare(`
    INSERT INTO estimate_versions (id, estimate_id, version_number, name)
    VALUES (?, ?, ?, ?)
  `),
  delete: db.prepare('DELETE FROM estimate_versions WHERE id = ?'),
}

// Version section queries
export const versionSectionQueries: Record<string, Statement> = {
  findByVersionId: db.prepare(`
    SELECT * FROM estimate_version_sections WHERE version_id = ? ORDER BY sort_order
  `),
  create: db.prepare(`
    INSERT INTO estimate_version_sections (id, version_id, original_section_id, name, sort_order, show_customer, show_master)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
}

// Act image queries
export const actImageQueries: Record<string, Statement> = {
  findByEstimateId: db.prepare('SELECT * FROM estimate_act_images WHERE estimate_id = ?'),
  findByEstimateAndType: db.prepare('SELECT * FROM estimate_act_images WHERE estimate_id = ? AND image_type = ?'),
  upsert: db.prepare(`
    INSERT INTO estimate_act_images (id, estimate_id, image_type, data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(estimate_id, image_type) DO UPDATE SET data = excluded.data
  `),
  delete: db.prepare('DELETE FROM estimate_act_images WHERE estimate_id = ? AND image_type = ?'),
}

// Version item queries
export const versionItemQueries: Record<string, Statement> = {
  findByVersionId: db.prepare(`
    SELECT * FROM estimate_version_items WHERE version_id = ? ORDER BY sort_order
  `),
  findByVersionSectionId: db.prepare(`
    SELECT * FROM estimate_version_items WHERE version_section_id = ? ORDER BY sort_order
  `),
  create: db.prepare(`
    INSERT INTO estimate_version_items (id, version_id, version_section_id, original_item_id, number, name, unit, quantity, 
      customer_price, customer_total, master_price, master_total, sort_order, show_customer, show_master)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
}
