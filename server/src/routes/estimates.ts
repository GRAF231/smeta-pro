import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { 
  estimateQueries, 
  sectionQueries, 
  itemQueries, 
  versionQueries, 
  versionSectionQueries, 
  versionItemQueries,
  actImageQueries,
  db 
} from '../models/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { 
  fetchSheetData, 
  parseEstimateData, 
  extractSheetIdFromUrl 
} from '../services/googleSheets'

const router = Router()

interface EstimateRow {
  id: string
  brigadir_id: string
  google_sheet_id: string
  title: string
  customer_link_token: string
  master_link_token: string
  column_mapping: string
  master_password: string | null
  last_synced_at: string | null
  created_at: string
}

interface SectionRow {
  id: string
  estimate_id: string
  name: string
  sort_order: number
  show_customer: number
  show_master: number
}

interface ItemRow {
  id: string
  estimate_id: string
  section_id: string
  number: string
  name: string
  unit: string
  quantity: number
  customer_price: number
  customer_total: number
  master_price: number
  master_total: number
  sort_order: number
  show_customer: number
  show_master: number
}

interface VersionRow {
  id: string
  estimate_id: string
  version_number: number
  name: string | null
  created_at: string
}

interface VersionSectionRow {
  id: string
  version_id: string
  original_section_id: string
  name: string
  sort_order: number
  show_customer: number
  show_master: number
}

interface VersionItemRow {
  id: string
  version_id: string
  version_section_id: string
  original_item_id: string
  number: string
  name: string
  unit: string
  quantity: number
  customer_price: number
  customer_total: number
  master_price: number
  master_total: number
  sort_order: number
  show_customer: number
  show_master: number
}

// Get all estimates for current user
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimates = estimateQueries.findByBrigadirId.all(req.user!.id) as EstimateRow[]
    
    res.json(estimates.map(e => ({
      id: e.id,
      title: e.title,
      googleSheetId: e.google_sheet_id,
      customerLinkToken: e.customer_link_token,
      masterLinkToken: e.master_link_token,
      masterPassword: e.master_password || '',
      lastSyncedAt: e.last_synced_at,
      createdAt: e.created_at,
    })))
  } catch (error) {
    console.error('Get estimates error:', error)
    res.status(500).json({ error: 'Ошибка получения смет' })
  }
})

// Get single estimate with all items
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const sections = sectionQueries.findByEstimateId.all(estimate.id) as SectionRow[]
    const items = itemQueries.findByEstimateId.all(estimate.id) as ItemRow[]

    // Group items by section
    const sectionsWithItems = sections.map(section => ({
      id: section.id,
      name: section.name,
      sortOrder: section.sort_order,
      showCustomer: Boolean(section.show_customer),
      showMaster: Boolean(section.show_master),
      items: items
        .filter(item => item.section_id === section.id)
        .map(item => ({
          id: item.id,
          number: item.number,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          customerPrice: item.customer_price,
          customerTotal: item.customer_total,
          masterPrice: item.master_price,
          masterTotal: item.master_total,
          sortOrder: item.sort_order,
          showCustomer: Boolean(item.show_customer),
          showMaster: Boolean(item.show_master),
        })),
    }))

    res.json({
      id: estimate.id,
      title: estimate.title,
      googleSheetId: estimate.google_sheet_id,
      customerLinkToken: estimate.customer_link_token,
      masterLinkToken: estimate.master_link_token,
      masterPassword: estimate.master_password || '',
      lastSyncedAt: estimate.last_synced_at,
      createdAt: estimate.created_at,
      sections: sectionsWithItems,
    })
  } catch (error) {
    console.error('Get estimate error:', error)
    res.status(500).json({ error: 'Ошибка получения сметы' })
  }
})

// Create estimate and sync data
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, googleSheetUrl } = req.body

    if (!title || !googleSheetUrl) {
      return res.status(400).json({ error: 'Название и ссылка на таблицу обязательны' })
    }

    let googleSheetId: string
    try {
      googleSheetId = extractSheetIdFromUrl(googleSheetUrl)
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message })
    }

    // Fetch and parse data from Google Sheets
    let rows: string[][]
    try {
      rows = await fetchSheetData(googleSheetId)
    } catch (err) {
      console.error('Sheet access error:', err)
      return res.status(400).json({ 
        error: 'Не удалось получить доступ к таблице. Убедитесь, что таблица открыта для сервисного аккаунта.' 
      })
    }

    const id = uuidv4()
    const customerLinkToken = uuidv4()
    const masterLinkToken = uuidv4()

    // Create estimate
    estimateQueries.create.run(
      id,
      req.user!.id,
      googleSheetId,
      title,
      customerLinkToken,
      masterLinkToken,
      '{}'
    )

    // Sync items from Google Sheets
    syncEstimateItems(id, rows)
    estimateQueries.updateLastSynced.run(id)

    res.status(201).json({
      id,
      title,
      googleSheetId,
      customerLinkToken,
      masterLinkToken,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Create estimate error:', error)
    res.status(500).json({ error: 'Ошибка создания сметы' })
  }
})

// Sync estimate with Google Sheets
router.post('/:id/sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    // Fetch data from Google Sheets
    const rows = await fetchSheetData(estimate.google_sheet_id)
    
    // Clear existing items and sections, then re-sync
    itemQueries.deleteByEstimateId.run(estimate.id)
    sectionQueries.deleteByEstimateId.run(estimate.id)
    
    // Sync new data
    syncEstimateItems(estimate.id, rows)
    estimateQueries.updateLastSynced.run(estimate.id)

    res.json({ message: 'Синхронизация завершена', syncedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ error: 'Ошибка синхронизации' })
  }
})

// Update section visibility
router.put('/:id/sections/:sectionId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, showCustomer, showMaster } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    sectionQueries.update.run(
      name,
      showCustomer ? 1 : 0,
      showMaster ? 1 : 0,
      req.params.sectionId
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Update section error:', error)
    res.status(500).json({ error: 'Ошибка обновления раздела' })
  }
})

// Update item
router.put('/:id/items/:itemId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, unit, quantity, customerPrice, masterPrice, showCustomer, showMaster } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const customerTotal = (quantity || 0) * (customerPrice || 0)
    const masterTotal = (quantity || 0) * (masterPrice || 0)

    itemQueries.update.run(
      name,
      unit,
      quantity,
      customerPrice,
      customerTotal,
      masterPrice,
      masterTotal,
      showCustomer ? 1 : 0,
      showMaster ? 1 : 0,
      req.params.itemId
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Update item error:', error)
    res.status(500).json({ error: 'Ошибка обновления позиции' })
  }
})

// Add new item
router.post('/:id/items', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { sectionId, name, unit, quantity, customerPrice, masterPrice } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const id = uuidv4()
    const customerTotal = (quantity || 0) * (customerPrice || 0)
    const masterTotal = (quantity || 0) * (masterPrice || 0)

    // Get max sort order
    const items = itemQueries.findBySectionId.all(sectionId) as ItemRow[]
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : 0

    itemQueries.create.run(
      id,
      estimate.id,
      sectionId,
      '', // number
      name,
      unit || '',
      quantity || 0,
      customerPrice || 0,
      customerTotal,
      masterPrice || 0,
      masterTotal,
      maxOrder + 1,
      1, // showCustomer
      1  // showMaster
    )

    res.status(201).json({ 
      id,
      name,
      unit,
      quantity,
      customerPrice,
      customerTotal,
      masterPrice,
      masterTotal,
      showCustomer: true,
      showMaster: true,
    })
  } catch (error) {
    console.error('Add item error:', error)
    res.status(500).json({ error: 'Ошибка добавления позиции' })
  }
})

// Delete item
router.delete('/:id/items/:itemId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    itemQueries.delete.run(req.params.itemId)
    res.status(204).send()
  } catch (error) {
    console.error('Delete item error:', error)
    res.status(500).json({ error: 'Ошибка удаления позиции' })
  }
})

// Add new section
router.post('/:id/sections', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const id = uuidv4()
    const sections = sectionQueries.findByEstimateId.all(estimate.id) as SectionRow[]
    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) : 0

    sectionQueries.create.run(id, estimate.id, name, maxOrder + 1, 1, 1)

    res.status(201).json({ id, name, showCustomer: true, showMaster: true, items: [] })
  } catch (error) {
    console.error('Add section error:', error)
    res.status(500).json({ error: 'Ошибка добавления раздела' })
  }
})

// Update estimate
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, googleSheetUrl } = req.body
    const { id } = req.params

    if (!title || !googleSheetUrl) {
      return res.status(400).json({ error: 'Название и ссылка на таблицу обязательны' })
    }

    let googleSheetId: string
    try {
      googleSheetId = extractSheetIdFromUrl(googleSheetUrl)
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message })
    }

    const result = estimateQueries.update.run(googleSheetId, title, id, req.user!.id)
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const estimate = estimateQueries.findById.get(id) as EstimateRow

    res.json({
      id: estimate.id,
      title: estimate.title,
      googleSheetId: estimate.google_sheet_id,
      customerLinkToken: estimate.customer_link_token,
      masterLinkToken: estimate.master_link_token,
      createdAt: estimate.created_at,
    })
  } catch (error) {
    console.error('Update estimate error:', error)
    res.status(500).json({ error: 'Ошибка обновления сметы' })
  }
})

// Delete estimate
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const result = estimateQueries.delete.run(req.params.id, req.user!.id)
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    res.status(204).send()
  } catch (error) {
    console.error('Delete estimate error:', error)
    res.status(500).json({ error: 'Ошибка удаления сметы' })
  }
})

// Get customer view (public) - now from database
router.get('/customer/:token', async (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findByCustomerToken.get(req.params.token) as EstimateRow | undefined
    
    if (!estimate) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const sections = sectionQueries.findByEstimateId.all(estimate.id) as SectionRow[]
    const items = itemQueries.findByEstimateId.all(estimate.id) as ItemRow[]

    // Filter for customer visibility and generate sequential numbers
    const visibleSections = sections
      .filter(s => s.show_customer)
      .map(section => {
        let itemNumber = 1
        const sectionItems = items
          .filter(item => item.section_id === section.id && item.show_customer)
          .map(item => ({
            number: String(itemNumber++),
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            price: item.customer_price,
            total: item.customer_total,
          }))
        
        return {
          name: section.name,
          items: sectionItems,
          subtotal: sectionItems.reduce((sum, i) => sum + i.total, 0),
        }
      })
      .filter(s => s.items.length > 0)

    const total = visibleSections.reduce((sum, s) => sum + s.subtotal, 0)

    res.json({
      title: estimate.title,
      sections: visibleSections,
      total,
    })
  } catch (error) {
    console.error('Customer view error:', error)
    res.status(500).json({ error: 'Ошибка загрузки сметы' })
  }
})

// Set/update master password
router.put('/:id/master-password', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    // Allow empty string to remove password
    const masterPassword = password && password.trim() ? password.trim() : null
    estimateQueries.updateMasterPassword.run(masterPassword, req.params.id, req.user!.id)

    res.json({ success: true, masterPassword: masterPassword || '' })
  } catch (error) {
    console.error('Update master password error:', error)
    res.status(500).json({ error: 'Ошибка обновления пароля' })
  }
})

// Helper to build master view data
function buildMasterViewData(estimate: EstimateRow) {
  const sections = sectionQueries.findByEstimateId.all(estimate.id) as SectionRow[]
  const items = itemQueries.findByEstimateId.all(estimate.id) as ItemRow[]

  // Filter for master visibility and generate sequential numbers
  const visibleSections = sections
    .filter(s => s.show_master)
    .map(section => {
      let itemNumber = 1
      const sectionItems = items
        .filter(item => item.section_id === section.id && item.show_master)
        .map(item => ({
          number: String(itemNumber++),
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          price: item.master_price,
          total: item.master_total,
        }))
      
      return {
        name: section.name,
        items: sectionItems,
        subtotal: sectionItems.reduce((sum, i) => sum + i.total, 0),
      }
    })
    .filter(s => s.items.length > 0)

  const total = visibleSections.reduce((sum, s) => sum + s.subtotal, 0)

  return {
    title: estimate.title,
    sections: visibleSections,
    total,
  }
}

// Get master view (public) - now from database
router.get('/master/:token', async (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findByMasterToken.get(req.params.token) as EstimateRow | undefined
    
    if (!estimate) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    // If master password is set, require verification
    if (estimate.master_password) {
      return res.json({
        requiresPassword: true,
        title: estimate.title,
      })
    }

    // No password set — return data directly
    res.json(buildMasterViewData(estimate))
  } catch (error) {
    console.error('Master view error:', error)
    res.status(500).json({ error: 'Ошибка загрузки сметы' })
  }
})

// Verify master password and return data
router.post('/master/:token/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body
    const estimate = estimateQueries.findByMasterToken.get(req.params.token) as EstimateRow | undefined
    
    if (!estimate) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    // Check password
    if (estimate.master_password && estimate.master_password !== (password || '').trim()) {
      return res.status(403).json({ error: 'Неверная кодовая фраза' })
    }

    res.json(buildMasterViewData(estimate))
  } catch (error) {
    console.error('Master verify error:', error)
    res.status(500).json({ error: 'Ошибка загрузки сметы' })
  }
})

// ========== VERSION CONTROL ENDPOINTS ==========

// Get all versions for an estimate
router.get('/:id/versions', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const versions = versionQueries.findByEstimateId.all(estimate.id) as VersionRow[]
    
    res.json(versions.map(v => ({
      id: v.id,
      versionNumber: v.version_number,
      name: v.name,
      createdAt: v.created_at,
    })))
  } catch (error) {
    console.error('Get versions error:', error)
    res.status(500).json({ error: 'Ошибка получения версий' })
  }
})

// Create a new version (snapshot)
router.post('/:id/versions', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    // Get next version number
    const maxVersion = versionQueries.getMaxVersionNumber.get(estimate.id) as { max_version: number }
    const versionNumber = maxVersion.max_version + 1

    // Create version record
    const versionId = uuidv4()
    versionQueries.create.run(versionId, estimate.id, versionNumber, name || null)

    // Copy current sections and items to version
    const sections = sectionQueries.findByEstimateId.all(estimate.id) as SectionRow[]
    const items = itemQueries.findByEstimateId.all(estimate.id) as ItemRow[]

    // Create a map from original section id to version section id
    const sectionIdMap = new Map<string, string>()

    for (const section of sections) {
      const versionSectionId = uuidv4()
      sectionIdMap.set(section.id, versionSectionId)
      
      versionSectionQueries.create.run(
        versionSectionId,
        versionId,
        section.id,
        section.name,
        section.sort_order,
        section.show_customer,
        section.show_master
      )
    }

    for (const item of items) {
      const versionSectionId = sectionIdMap.get(item.section_id)
      if (!versionSectionId) continue

      versionItemQueries.create.run(
        uuidv4(),
        versionId,
        versionSectionId,
        item.id,
        item.number,
        item.name,
        item.unit,
        item.quantity,
        item.customer_price,
        item.customer_total,
        item.master_price,
        item.master_total,
        item.sort_order,
        item.show_customer,
        item.show_master
      )
    }

    res.status(201).json({
      id: versionId,
      versionNumber,
      name: name || null,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Create version error:', error)
    res.status(500).json({ error: 'Ошибка создания версии' })
  }
})

// Get specific version details
router.get('/:id/versions/:versionId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const version = versionQueries.findById.get(req.params.versionId) as VersionRow | undefined
    
    if (!version || version.estimate_id !== estimate.id) {
      return res.status(404).json({ error: 'Версия не найдена' })
    }

    const sections = versionSectionQueries.findByVersionId.all(version.id) as VersionSectionRow[]
    const items = versionItemQueries.findByVersionId.all(version.id) as VersionItemRow[]

    // Group items by section
    const sectionsWithItems = sections.map(section => ({
      id: section.id,
      name: section.name,
      sortOrder: section.sort_order,
      showCustomer: Boolean(section.show_customer),
      showMaster: Boolean(section.show_master),
      items: items
        .filter(item => item.version_section_id === section.id)
        .map(item => ({
          id: item.id,
          number: item.number,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          customerPrice: item.customer_price,
          customerTotal: item.customer_total,
          masterPrice: item.master_price,
          masterTotal: item.master_total,
          sortOrder: item.sort_order,
          showCustomer: Boolean(item.show_customer),
          showMaster: Boolean(item.show_master),
        })),
    }))

    res.json({
      id: version.id,
      versionNumber: version.version_number,
      name: version.name,
      createdAt: version.created_at,
      sections: sectionsWithItems,
    })
  } catch (error) {
    console.error('Get version error:', error)
    res.status(500).json({ error: 'Ошибка получения версии' })
  }
})

// Restore estimate from a version
router.post('/:id/versions/:versionId/restore', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const version = versionQueries.findById.get(req.params.versionId) as VersionRow | undefined
    
    if (!version || version.estimate_id !== estimate.id) {
      return res.status(404).json({ error: 'Версия не найдена' })
    }

    // Get version data
    const versionSections = versionSectionQueries.findByVersionId.all(version.id) as VersionSectionRow[]
    const versionItems = versionItemQueries.findByVersionId.all(version.id) as VersionItemRow[]

    // Delete current sections and items
    itemQueries.deleteByEstimateId.run(estimate.id)
    sectionQueries.deleteByEstimateId.run(estimate.id)

    // Create a map from version section id to new section id
    const sectionIdMap = new Map<string, string>()

    // Restore sections
    for (const vSection of versionSections) {
      const newSectionId = uuidv4()
      sectionIdMap.set(vSection.id, newSectionId)
      
      sectionQueries.create.run(
        newSectionId,
        estimate.id,
        vSection.name,
        vSection.sort_order,
        vSection.show_customer,
        vSection.show_master
      )
    }

    // Restore items
    for (const vItem of versionItems) {
      const newSectionId = sectionIdMap.get(vItem.version_section_id)
      if (!newSectionId) continue

      itemQueries.create.run(
        uuidv4(),
        estimate.id,
        newSectionId,
        vItem.number,
        vItem.name,
        vItem.unit,
        vItem.quantity,
        vItem.customer_price,
        vItem.customer_total,
        vItem.master_price,
        vItem.master_total,
        vItem.sort_order,
        vItem.show_customer,
        vItem.show_master
      )
    }

    res.json({ 
      message: 'Смета восстановлена из версии', 
      restoredFrom: {
        versionNumber: version.version_number,
        name: version.name,
      }
    })
  } catch (error) {
    console.error('Restore version error:', error)
    res.status(500).json({ error: 'Ошибка восстановления версии' })
  }
})

// ========== ACT IMAGES ENDPOINTS ==========

interface ActImageRow {
  id: string
  estimate_id: string
  image_type: string
  data: string
  created_at: string
}

// Get all act images for an estimate
router.get('/:id/act-images', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const images = actImageQueries.findByEstimateId.all(estimate.id) as ActImageRow[]
    
    const result: Record<string, string> = {}
    images.forEach(img => {
      result[img.image_type] = img.data
    })

    res.json(result)
  } catch (error) {
    console.error('Get act images error:', error)
    res.status(500).json({ error: 'Ошибка получения изображений' })
  }
})

// Upload/replace an act image
router.post('/:id/act-images', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { imageType, data } = req.body
    
    if (!imageType || !data) {
      return res.status(400).json({ error: 'Тип изображения и данные обязательны' })
    }

    if (!['logo', 'stamp', 'signature'].includes(imageType)) {
      return res.status(400).json({ error: 'Неверный тип изображения. Допустимые: logo, stamp, signature' })
    }

    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const id = uuidv4()
    actImageQueries.upsert.run(id, estimate.id, imageType, data)

    res.json({ success: true, imageType })
  } catch (error) {
    console.error('Upload act image error:', error)
    res.status(500).json({ error: 'Ошибка загрузки изображения' })
  }
})

// Delete an act image
router.delete('/:id/act-images/:imageType', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const imageType = req.params.imageType as string
    
    if (!['logo', 'stamp', 'signature'].includes(imageType)) {
      return res.status(400).json({ error: 'Неверный тип изображения' })
    }

    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    actImageQueries.delete.run(estimate.id, imageType)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete act image error:', error)
    res.status(500).json({ error: 'Ошибка удаления изображения' })
  }
})

// ========== HELPER FUNCTIONS ==========

// Helper function to sync items from Google Sheets
function syncEstimateItems(estimateId: string, rows: string[][]) {
  const customerData = parseEstimateData(rows, 'customer')
  const masterData = parseEstimateData(rows, 'master')

  // Create a map of master prices by item name
  const masterPriceMap = new Map<string, { price: number; total: number }>()
  masterData.sections.forEach(section => {
    section.items.forEach(item => {
      masterPriceMap.set(`${section.name}:${item.name}`, {
        price: item.price,
        total: item.total,
      })
    })
  })

  let sectionOrder = 0
  for (const section of customerData.sections) {
    const sectionId = uuidv4()
    sectionQueries.create.run(sectionId, estimateId, section.name, sectionOrder++, 1, 1)

    let itemOrder = 0
    for (const item of section.items) {
      const masterInfo = masterPriceMap.get(`${section.name}:${item.name}`) || { price: 0, total: 0 }
      
      itemQueries.create.run(
        uuidv4(),
        estimateId,
        sectionId,
        item.number,
        item.name,
        item.unit,
        item.quantity,
        item.price,
        item.total,
        masterInfo.price,
        masterInfo.total,
        itemOrder++,
        1, // showCustomer
        masterInfo.total > 0 ? 1 : 0 // showMaster - only if has master price
      )
    }
  }
}

export default router
