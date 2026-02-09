import Database, { Database as DatabaseType } from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

/**
 * Инициализация базы данных
 * Создает подключение к БД, таблицы и выполняет миграции
 */
export function initDatabase(): DatabaseType {
  // Ensure data directory exists
  const dataDir = path.join(__dirname, '../../data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.join(dataDir, 'smeta.db')
  const db: DatabaseType = new Database(dbPath)

  // Create tables
  createTables(db)
  
  // Run migrations
  migrateToViews(db)

  console.log('✅ Database initialized')
  return db
}

/**
 * Создание всех таблиц базы данных
 */
function createTables(db: DatabaseType): void {
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

  // Create estimates table (legacy columns customer_link_token, master_link_token, master_password kept for compat)
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

  // Create estimate_sections table (legacy columns show_customer, show_master kept)
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

  // Create estimate_items table (legacy columns customer_price etc. kept)
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

  // ========== NEW: estimate_views ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_views (
      id TEXT PRIMARY KEY,
      estimate_id TEXT NOT NULL,
      name TEXT NOT NULL,
      link_token TEXT UNIQUE NOT NULL,
      password TEXT DEFAULT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
    )
  `)

  // ========== NEW: view_section_settings ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS view_section_settings (
      id TEXT PRIMARY KEY,
      view_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      visible INTEGER DEFAULT 1,
      FOREIGN KEY (view_id) REFERENCES estimate_views(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES estimate_sections(id) ON DELETE CASCADE,
      UNIQUE(view_id, section_id)
    )
  `)

  // ========== NEW: view_item_settings ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS view_item_settings (
      id TEXT PRIMARY KEY,
      view_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      visible INTEGER DEFAULT 1,
      FOREIGN KEY (view_id) REFERENCES estimate_views(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES estimate_items(id) ON DELETE CASCADE,
      UNIQUE(view_id, item_id)
    )
  `)

  // ========== VERSION TABLES ==========

  // Create estimate_versions table
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

  // Create estimate_version_sections table (legacy columns kept)
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

  // Create estimate_version_items table (legacy columns kept)
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

  // ========== NEW: Version view tables ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_version_views (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      original_view_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (version_id) REFERENCES estimate_versions(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS version_view_section_settings (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      version_view_id TEXT NOT NULL,
      version_section_id TEXT NOT NULL,
      visible INTEGER DEFAULT 1,
      FOREIGN KEY (version_id) REFERENCES estimate_versions(id) ON DELETE CASCADE,
      FOREIGN KEY (version_view_id) REFERENCES estimate_version_views(id) ON DELETE CASCADE,
      FOREIGN KEY (version_section_id) REFERENCES estimate_version_sections(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS version_view_item_settings (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      version_view_id TEXT NOT NULL,
      version_item_id TEXT NOT NULL,
      price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      visible INTEGER DEFAULT 1,
      FOREIGN KEY (version_id) REFERENCES estimate_versions(id) ON DELETE CASCADE,
      FOREIGN KEY (version_view_id) REFERENCES estimate_version_views(id) ON DELETE CASCADE,
      FOREIGN KEY (version_item_id) REFERENCES estimate_version_items(id) ON DELETE CASCADE
    )
  `)

  // Create estimate_act_images table
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

  // ========== SAVED ACTS TABLES ==========

  // Create saved_acts table -- stores act metadata
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_acts (
      id TEXT PRIMARY KEY,
      estimate_id TEXT NOT NULL,
      view_id TEXT,
      act_number TEXT NOT NULL,
      act_date TEXT NOT NULL,
      executor_name TEXT DEFAULT '',
      executor_details TEXT DEFAULT '',
      customer_name TEXT DEFAULT '',
      director_name TEXT DEFAULT '',
      service_name TEXT DEFAULT '',
      selection_mode TEXT DEFAULT 'sections' CHECK(selection_mode IN ('sections', 'items')),
      grand_total REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
    )
  `)

  // Create saved_act_items table -- items/sections snapshot included in each act
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_act_items (
      id TEXT PRIMARY KEY,
      act_id TEXT NOT NULL,
      item_id TEXT,
      section_id TEXT,
      name TEXT NOT NULL,
      unit TEXT DEFAULT '',
      quantity REAL DEFAULT 0,
      price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      FOREIGN KEY (act_id) REFERENCES saved_acts(id) ON DELETE CASCADE
    )
  `)

  // Create estimate_materials table
  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_materials (
      id TEXT PRIMARY KEY,
      estimate_id TEXT NOT NULL,
      name TEXT NOT NULL,
      article TEXT DEFAULT '',
      brand TEXT DEFAULT '',
      unit TEXT DEFAULT 'шт',
      price REAL DEFAULT 0,
      quantity REAL DEFAULT 1,
      total REAL DEFAULT 0,
      url TEXT DEFAULT '',
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
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
    CREATE INDEX IF NOT EXISTS idx_materials_estimate ON estimate_materials(estimate_id);
    CREATE INDEX IF NOT EXISTS idx_views_estimate ON estimate_views(estimate_id);
    CREATE INDEX IF NOT EXISTS idx_views_link_token ON estimate_views(link_token);
    CREATE INDEX IF NOT EXISTS idx_view_section_settings_view ON view_section_settings(view_id);
    CREATE INDEX IF NOT EXISTS idx_view_section_settings_section ON view_section_settings(section_id);
    CREATE INDEX IF NOT EXISTS idx_view_item_settings_view ON view_item_settings(view_id);
    CREATE INDEX IF NOT EXISTS idx_view_item_settings_item ON view_item_settings(item_id);
    CREATE INDEX IF NOT EXISTS idx_version_views_version ON estimate_version_views(version_id);
    CREATE INDEX IF NOT EXISTS idx_version_view_section_settings_version ON version_view_section_settings(version_id);
    CREATE INDEX IF NOT EXISTS idx_version_view_item_settings_version ON version_view_item_settings(version_id);
    CREATE INDEX IF NOT EXISTS idx_saved_acts_estimate ON saved_acts(estimate_id);
    CREATE INDEX IF NOT EXISTS idx_saved_act_items_act ON saved_act_items(act_id);
    CREATE INDEX IF NOT EXISTS idx_saved_act_items_item ON saved_act_items(item_id);
    CREATE INDEX IF NOT EXISTS idx_saved_act_items_section ON saved_act_items(section_id);
  `)
}

/**
 * Миграция данных из старой системы customer/master в новую систему views
 */
function migrateToViews(db: DatabaseType): void {
  // Check if migration is needed: estimates exist but no views
  const estimateCount = (db.prepare('SELECT COUNT(*) as cnt FROM estimates').get() as { cnt: number }).cnt
  const viewCount = (db.prepare('SELECT COUNT(*) as cnt FROM estimate_views').get() as { cnt: number }).cnt

  if (estimateCount === 0 || viewCount > 0) {
    return // nothing to migrate or already migrated
  }

  console.log(`[Migration] Migrating ${estimateCount} estimates to new views system...`)

  const estimates = db.prepare('SELECT * FROM estimates').all() as any[]

  const insertView = db.prepare(`
    INSERT INTO estimate_views (id, estimate_id, name, link_token, password, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertViewSectionSetting = db.prepare(`
    INSERT OR IGNORE INTO view_section_settings (id, view_id, section_id, visible)
    VALUES (?, ?, ?, ?)
  `)
  const insertViewItemSetting = db.prepare(`
    INSERT OR IGNORE INTO view_item_settings (id, view_id, item_id, price, total, visible)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const migrateAll = db.transaction(() => {
    for (const est of estimates) {
      // Create customer view
      const customerViewId = uuidv4()
      insertView.run(
        customerViewId,
        est.id,
        'Заказчик',
        est.customer_link_token,
        null,
        0
      )

      // Create master view
      const masterViewId = uuidv4()
      insertView.run(
        masterViewId,
        est.id,
        'Мастер',
        est.master_link_token,
        est.master_password || null,
        1
      )

      // Migrate sections
      const sections = db.prepare('SELECT * FROM estimate_sections WHERE estimate_id = ?').all(est.id) as any[]
      for (const section of sections) {
        insertViewSectionSetting.run(uuidv4(), customerViewId, section.id, section.show_customer)
        insertViewSectionSetting.run(uuidv4(), masterViewId, section.id, section.show_master)
      }

      // Migrate items
      const items = db.prepare('SELECT * FROM estimate_items WHERE estimate_id = ?').all(est.id) as any[]
      for (const item of items) {
        insertViewItemSetting.run(uuidv4(), customerViewId, item.id, item.customer_price, item.customer_total, item.show_customer)
        insertViewItemSetting.run(uuidv4(), masterViewId, item.id, item.master_price, item.master_total, item.show_master)
      }
    }
  })

  migrateAll()
  console.log(`[Migration] Done. Created ${estimateCount * 2} views.`)
}

