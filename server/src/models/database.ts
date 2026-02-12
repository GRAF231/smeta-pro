import { Database as DatabaseType, Statement } from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import { initDatabase as initDb } from '../config/database'

// Initialize database and get instance
export const db: DatabaseType = initDb()

// Re-export initDatabase for backward compatibility
export function initDatabase() {
  // Database is already initialized, just log
  console.log('✅ Database initialized')
}

// Legacy: keep these functions for reference but they're now in config/database.ts
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

// Migrate legacy customer/master data to new estimate_views system
function migrateToViews() {
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

// Note: Tables are created by initDatabase() from config/database.ts
// These functions are kept for reference but are now in config/database.ts

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
  create: db.prepare(`
    INSERT INTO estimates (id, brigadir_id, google_sheet_id, title, customer_link_token, master_link_token, column_mapping)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE estimates SET google_sheet_id = ?, title = ? WHERE id = ? AND brigadir_id = ?
  `),
  updateLastSynced: db.prepare(`
    UPDATE estimates SET last_synced_at = datetime('now') WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM estimates WHERE id = ? AND brigadir_id = ?'),
}

// Section queries (no more show_customer/show_master in create/update)
export const sectionQueries: Record<string, Statement> = {
  findByEstimateId: db.prepare('SELECT * FROM estimate_sections WHERE estimate_id = ? ORDER BY sort_order'),
  findById: db.prepare('SELECT * FROM estimate_sections WHERE id = ?'),
  create: db.prepare(`
    INSERT INTO estimate_sections (id, estimate_id, name, sort_order)
    VALUES (?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE estimate_sections SET name = ? WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM estimate_sections WHERE id = ?'),
  deleteByEstimateId: db.prepare('DELETE FROM estimate_sections WHERE estimate_id = ?'),
}

// Item queries (no more customer/master price columns in create/update)
export const itemQueries: Record<string, Statement> = {
  findByEstimateId: db.prepare(`
    SELECT * FROM estimate_items WHERE estimate_id = ? ORDER BY sort_order
  `),
  findBySectionId: db.prepare(`
    SELECT * FROM estimate_items WHERE section_id = ? ORDER BY sort_order
  `),
  findById: db.prepare('SELECT * FROM estimate_items WHERE id = ?'),
  create: db.prepare(`
    INSERT INTO estimate_items (id, estimate_id, section_id, number, name, unit, quantity, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE estimate_items SET name = ?, unit = ?, quantity = ? WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM estimate_items WHERE id = ?'),
  deleteByEstimateId: db.prepare('DELETE FROM estimate_items WHERE estimate_id = ?'),
}

// ========== VIEW QUERIES ==========

export const viewQueries: Record<string, Statement> = {
  findByEstimateId: db.prepare('SELECT * FROM estimate_views WHERE estimate_id = ? ORDER BY sort_order'),
  findById: db.prepare('SELECT * FROM estimate_views WHERE id = ?'),
  findByLinkToken: db.prepare('SELECT * FROM estimate_views WHERE link_token = ?'),
  create: db.prepare(`
    INSERT INTO estimate_views (id, estimate_id, name, link_token, password, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE estimate_views SET name = ?, password = ? WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM estimate_views WHERE id = ?'),
  deleteByEstimateId: db.prepare('DELETE FROM estimate_views WHERE estimate_id = ?'),
  getMaxSortOrder: db.prepare('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM estimate_views WHERE estimate_id = ?'),
}

export const viewSectionSettingsQueries: Record<string, Statement> = {
  findByViewId: db.prepare('SELECT * FROM view_section_settings WHERE view_id = ?'),
  findByViewAndSection: db.prepare('SELECT * FROM view_section_settings WHERE view_id = ? AND section_id = ?'),
  upsert: db.prepare(`
    INSERT INTO view_section_settings (id, view_id, section_id, visible)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(view_id, section_id) DO UPDATE SET visible = excluded.visible
  `),
  deleteByViewId: db.prepare('DELETE FROM view_section_settings WHERE view_id = ?'),
  deleteBySectionId: db.prepare('DELETE FROM view_section_settings WHERE section_id = ?'),
}

export const viewItemSettingsQueries: Record<string, Statement> = {
  findByViewId: db.prepare('SELECT * FROM view_item_settings WHERE view_id = ?'),
  findByViewAndItem: db.prepare('SELECT * FROM view_item_settings WHERE view_id = ? AND item_id = ?'),
  findByItemId: db.prepare('SELECT * FROM view_item_settings WHERE item_id = ?'),
  upsert: db.prepare(`
    INSERT INTO view_item_settings (id, view_id, item_id, price, total, visible)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(view_id, item_id) DO UPDATE SET price = excluded.price, total = excluded.total, visible = excluded.visible
  `),
  deleteByViewId: db.prepare('DELETE FROM view_item_settings WHERE view_id = ?'),
  deleteByItemId: db.prepare('DELETE FROM view_item_settings WHERE item_id = ?'),
}

// ========== VERSION QUERIES ==========

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

export const versionSectionQueries: Record<string, Statement> = {
  findByVersionId: db.prepare(`
    SELECT * FROM estimate_version_sections WHERE version_id = ? ORDER BY sort_order
  `),
  create: db.prepare(`
    INSERT INTO estimate_version_sections (id, version_id, original_section_id, name, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `),
}

export const versionItemQueries: Record<string, Statement> = {
  findByVersionId: db.prepare(`
    SELECT * FROM estimate_version_items WHERE version_id = ? ORDER BY sort_order
  `),
  findByVersionSectionId: db.prepare(`
    SELECT * FROM estimate_version_items WHERE version_section_id = ? ORDER BY sort_order
  `),
  create: db.prepare(`
    INSERT INTO estimate_version_items (id, version_id, version_section_id, original_item_id, number, name, unit, quantity, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
}

export const versionViewQueries: Record<string, Statement> = {
  findByVersionId: db.prepare(`
    SELECT * FROM estimate_version_views WHERE version_id = ? ORDER BY sort_order
  `),
  create: db.prepare(`
    INSERT INTO estimate_version_views (id, version_id, original_view_id, name, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `),
}

export const versionViewSectionSettingsQueries: Record<string, Statement> = {
  findByVersionId: db.prepare(`
    SELECT * FROM version_view_section_settings WHERE version_id = ?
  `),
  findByVersionViewId: db.prepare(`
    SELECT * FROM version_view_section_settings WHERE version_view_id = ?
  `),
  create: db.prepare(`
    INSERT INTO version_view_section_settings (id, version_id, version_view_id, version_section_id, visible)
    VALUES (?, ?, ?, ?, ?)
  `),
}

export const versionViewItemSettingsQueries: Record<string, Statement> = {
  findByVersionId: db.prepare(`
    SELECT * FROM version_view_item_settings WHERE version_id = ?
  `),
  findByVersionViewId: db.prepare(`
    SELECT * FROM version_view_item_settings WHERE version_view_id = ?
  `),
  create: db.prepare(`
    INSERT INTO version_view_item_settings (id, version_id, version_view_id, version_item_id, price, total, visible)
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

// ========== SAVED ACTS QUERIES ==========

export const savedActQueries: Record<string, Statement> = {
  findByEstimateId: db.prepare('SELECT * FROM saved_acts WHERE estimate_id = ? ORDER BY created_at DESC'),
  findById: db.prepare('SELECT * FROM saved_acts WHERE id = ?'),
  create: db.prepare(`
    INSERT INTO saved_acts (id, estimate_id, view_id, act_number, act_date, executor_name, executor_details, customer_name, director_name, service_name, selection_mode, grand_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  delete: db.prepare('DELETE FROM saved_acts WHERE id = ?'),
}

export const savedActItemQueries: Record<string, Statement> = {
  findByActId: db.prepare('SELECT * FROM saved_act_items WHERE act_id = ?'),
  findByEstimateItemIds: db.prepare(`
    SELECT sai.*, sa.act_number, sa.act_date, sa.id as act_id
    FROM saved_act_items sai
    JOIN saved_acts sa ON sa.id = sai.act_id
    WHERE sa.estimate_id = ? AND sai.item_id IS NOT NULL
    ORDER BY sa.created_at DESC
  `),
  create: db.prepare(`
    INSERT INTO saved_act_items (id, act_id, item_id, section_id, name, unit, quantity, price, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
}

// Material queries
export const materialQueries: Record<string, Statement> = {
  findByEstimateId: db.prepare('SELECT * FROM estimate_materials WHERE estimate_id = ? ORDER BY sort_order'),
  findById: db.prepare('SELECT * FROM estimate_materials WHERE id = ?'),
  create: db.prepare(`
    INSERT INTO estimate_materials (id, estimate_id, name, article, brand, unit, price, quantity, total, url, description, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE estimate_materials SET
      name = ?, article = ?, brand = ?, unit = ?, price = ?, quantity = ?, total = ?,
      url = ?, description = ?, updated_at = datetime('now')
    WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM estimate_materials WHERE id = ?'),
  deleteByEstimateId: db.prepare('DELETE FROM estimate_materials WHERE estimate_id = ?'),
  getMaxSortOrder: db.prepare('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM estimate_materials WHERE estimate_id = ?'),
}

// ========== AI GENERATION QUERIES ==========

// Generation task queries
export const generationTaskQueries: Record<string, Statement> = {
  findById: db.prepare('SELECT * FROM estimate_generation_tasks WHERE id = ?'),
  findByUserId: db.prepare('SELECT * FROM estimate_generation_tasks WHERE user_id = ? ORDER BY created_at DESC'),
  findByEstimateId: db.prepare('SELECT * FROM estimate_generation_tasks WHERE estimate_id = ? ORDER BY created_at DESC'),
  create: db.prepare(`
    INSERT INTO estimate_generation_tasks (id, estimate_id, user_id, status, current_stage, progress_percent, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  updateStatus: db.prepare(`
    UPDATE estimate_generation_tasks 
    SET status = ?, current_stage = ?, progress_percent = ?, updated_at = datetime('now')
    WHERE id = ?
  `),
  setError: db.prepare(`
    UPDATE estimate_generation_tasks 
    SET status = 'failed', error_message = ?, updated_at = datetime('now')
    WHERE id = ?
  `),
  complete: db.prepare(`
    UPDATE estimate_generation_tasks 
    SET status = 'completed', estimate_id = ?, current_stage = NULL, progress_percent = 100, updated_at = datetime('now')
    WHERE id = ?
  `),
}

// Intermediate data queries
export const intermediateDataQueries: Record<string, Statement> = {
  findByTaskId: db.prepare('SELECT * FROM generation_intermediate_data WHERE task_id = ? ORDER BY created_at'),
  findByTaskAndStage: db.prepare('SELECT * FROM generation_intermediate_data WHERE task_id = ? AND stage = ? ORDER BY created_at'),
  findByTaskAndType: db.prepare('SELECT * FROM generation_intermediate_data WHERE task_id = ? AND data_type = ? ORDER BY created_at'),
  findById: db.prepare('SELECT * FROM generation_intermediate_data WHERE id = ?'),
  save: db.prepare(`
    INSERT INTO generation_intermediate_data (id, task_id, stage, data_type, data_json)
    VALUES (?, ?, ?, ?, ?)
  `),
  deleteByTask: db.prepare('DELETE FROM generation_intermediate_data WHERE task_id = ?'),
}

// Page classification queries
export const pageClassificationQueries: Record<string, Statement> = {
  findByTaskId: db.prepare('SELECT * FROM pdf_page_classifications WHERE task_id = ? ORDER BY page_number'),
  findByTaskAndType: db.prepare('SELECT * FROM pdf_page_classifications WHERE task_id = ? AND page_type = ? ORDER BY page_number'),
  findByTaskAndRoom: db.prepare('SELECT * FROM pdf_page_classifications WHERE task_id = ? AND room_name = ? ORDER BY page_number'),
  findById: db.prepare('SELECT * FROM pdf_page_classifications WHERE id = ?'),
  saveClassification: db.prepare(`
    INSERT INTO pdf_page_classifications (id, task_id, page_number, page_type, room_name, image_data_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  deleteByTask: db.prepare('DELETE FROM pdf_page_classifications WHERE task_id = ?'),
}

// Extracted room data queries
export const extractedRoomDataQueries: Record<string, Statement> = {
  findByTaskId: db.prepare('SELECT * FROM extracted_room_data WHERE task_id = ? ORDER BY room_name'),
  findByTaskAndRoom: db.prepare('SELECT * FROM extracted_room_data WHERE task_id = ? AND room_name = ?'),
  findById: db.prepare('SELECT * FROM extracted_room_data WHERE id = ?'),
  saveRoomData: db.prepare(`
    INSERT INTO extracted_room_data (id, task_id, room_name, room_type, area, wall_area, floor_area, ceiling_area, extracted_data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  deleteByTask: db.prepare('DELETE FROM extracted_room_data WHERE task_id = ?'),
}
