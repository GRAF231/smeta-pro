import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'
import { PDFParse } from 'pdf-parse'
import sharp from 'sharp'
import { 
  estimateQueries, 
  sectionQueries, 
  itemQueries, 
  versionQueries, 
  versionSectionQueries, 
  versionItemQueries,
  viewQueries,
  viewSectionSettingsQueries,
  viewItemSettingsQueries,
  versionViewQueries,
  versionViewSectionSettingsQueries,
  versionViewItemSettingsQueries,
  actImageQueries,
  db 
} from '../models/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { 
  fetchSheetData, 
  parseEstimateData, 
  extractSheetIdFromUrl,
  fetchPricelistData
} from '../services/googleSheets'
import { generateEstimateFromPDF } from '../services/openrouter'

const router = Router()

// Configure multer for PDF upload (in-memory storage, max 100MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Допускаются только PDF файлы'))
    }
  },
})

// ========== TYPE DEFINITIONS ==========

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
}

interface ItemRow {
  id: string
  estimate_id: string
  section_id: string
  number: string
  name: string
  unit: string
  quantity: number
  sort_order: number
}

interface ViewRow {
  id: string
  estimate_id: string
  name: string
  link_token: string
  password: string | null
  sort_order: number
  created_at: string
}

interface ViewSectionSettingRow {
  id: string
  view_id: string
  section_id: string
  visible: number
}

interface ViewItemSettingRow {
  id: string
  view_id: string
  item_id: string
  price: number
  total: number
  visible: number
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
  sort_order: number
}

interface VersionViewRow {
  id: string
  version_id: string
  original_view_id: string
  name: string
  sort_order: number
}

interface VersionViewSectionSettingRow {
  id: string
  version_id: string
  version_view_id: string
  version_section_id: string
  visible: number
}

interface VersionViewItemSettingRow {
  id: string
  version_id: string
  version_view_id: string
  version_item_id: string
  price: number
  total: number
  visible: number
}

interface ActImageRow {
  id: string
  estimate_id: string
  image_type: string
  data: string
  created_at: string
}

// ========== HELPER: Create view settings for new items/sections ==========

function createViewSettingsForNewItem(estimateId: string, itemId: string) {
  const views = viewQueries.findByEstimateId.all(estimateId) as ViewRow[]
  for (const view of views) {
    viewItemSettingsQueries.upsert.run(uuidv4(), view.id, itemId, 0, 0, 1)
  }
}

function createViewSettingsForNewSection(estimateId: string, sectionId: string) {
  const views = viewQueries.findByEstimateId.all(estimateId) as ViewRow[]
  for (const view of views) {
    viewSectionSettingsQueries.upsert.run(uuidv4(), view.id, sectionId, 1)
  }
}

// ========== HELPER: Build full estimate response ==========

function buildEstimateResponse(estimate: EstimateRow) {
  const views = viewQueries.findByEstimateId.all(estimate.id) as ViewRow[]
  const sections = sectionQueries.findByEstimateId.all(estimate.id) as SectionRow[]
  const items = itemQueries.findByEstimateId.all(estimate.id) as ItemRow[]

  // Load all view settings
  const allViewSectionSettings: ViewSectionSettingRow[] = []
  const allViewItemSettings: ViewItemSettingRow[] = []
  for (const view of views) {
    const ss = viewSectionSettingsQueries.findByViewId.all(view.id) as ViewSectionSettingRow[]
    const is = viewItemSettingsQueries.findByViewId.all(view.id) as ViewItemSettingRow[]
    allViewSectionSettings.push(...ss)
    allViewItemSettings.push(...is)
  }

  // Build section view settings map: sectionId -> { viewId: { visible } }
  const sectionViewMap = new Map<string, Record<string, { visible: boolean }>>()
  for (const s of allViewSectionSettings) {
    if (!sectionViewMap.has(s.section_id)) sectionViewMap.set(s.section_id, {})
    sectionViewMap.get(s.section_id)![s.view_id] = { visible: Boolean(s.visible) }
  }

  // Build item view settings map: itemId -> { viewId: { price, total, visible } }
  const itemViewMap = new Map<string, Record<string, { price: number; total: number; visible: boolean }>>()
  for (const i of allViewItemSettings) {
    if (!itemViewMap.has(i.item_id)) itemViewMap.set(i.item_id, {})
    itemViewMap.get(i.item_id)![i.view_id] = { price: i.price, total: i.total, visible: Boolean(i.visible) }
  }

  const sectionsWithItems = sections.map(section => ({
    id: section.id,
    name: section.name,
    sortOrder: section.sort_order,
    viewSettings: sectionViewMap.get(section.id) || {},
    items: items
      .filter(item => item.section_id === section.id)
      .map(item => ({
        id: item.id,
        number: item.number,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        sortOrder: item.sort_order,
        viewSettings: itemViewMap.get(item.id) || {},
      })),
  }))

  return {
    id: estimate.id,
    title: estimate.title,
    googleSheetId: estimate.google_sheet_id,
    lastSyncedAt: estimate.last_synced_at,
    createdAt: estimate.created_at,
    views: views.map(v => ({
      id: v.id,
      name: v.name,
      linkToken: v.link_token,
      password: v.password || '',
      sortOrder: v.sort_order,
    })),
    sections: sectionsWithItems,
  }
}

// ========== GENERATE FROM PDF ==========

router.post('/generate', authMiddleware, upload.single('pdf'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, pricelistUrl, comments } = req.body
    const pdfFile = req.file

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF файл обязателен' })
    }

    if (!title) {
      return res.status(400).json({ error: 'Название сметы обязательно' })
    }

    if (!pricelistUrl) {
      return res.status(400).json({ error: 'Ссылка на прайс-лист обязательна' })
    }

    // Extract sheet ID from pricelist URL
    let pricelistSheetId: string
    try {
      pricelistSheetId = extractSheetIdFromUrl(pricelistUrl)
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message })
    }

    // Step 1: Convert PDF pages to images
    let pageDataUrls: string[]
    const parser = new PDFParse({ data: new Uint8Array(pdfFile.buffer) })
    try {
      const screenshotResult = await parser.getScreenshot({
        imageDataUrl: false,
        imageBuffer: true,
        desiredWidth: 800,
      })

      const totalPages = screenshotResult.total
      if (!screenshotResult.pages || screenshotResult.pages.length === 0) {
        return res.status(400).json({ 
          error: 'Не удалось обработать PDF. Убедитесь, что файл не поврежден.' 
        })
      }

      console.log(`[PDF] Got ${screenshotResult.pages.length} of ${totalPages} pages, converting to JPEG...`)

      pageDataUrls = []
      for (let i = 0; i < screenshotResult.pages.length; i++) {
        const page = screenshotResult.pages[i]
        const jpegBuffer = await sharp(Buffer.from(page.data))
          .jpeg({ quality: 65 })
          .toBuffer()
        pageDataUrls.push(`data:image/jpeg;base64,${jpegBuffer.toString('base64')}`)
        ;(page as any).data = null
        if ((i + 1) % 10 === 0) {
          console.log(`[PDF] Converted ${i + 1}/${screenshotResult.pages.length} pages to JPEG`)
        }
      }

      const totalSizeMB = pageDataUrls.reduce((sum, url) => sum + url.length, 0) / (1024 * 1024)
      console.log(`[PDF] Converted ${pageDataUrls.length} pages to JPEG (total ~${totalSizeMB.toFixed(1)} MB base64)`)
    } catch (err) {
      console.error('PDF screenshot error:', err)
      return res.status(400).json({ error: 'Ошибка обработки PDF файла. Убедитесь, что файл не поврежден.' })
    } finally {
      await parser.destroy().catch(() => {})
    }

    // Step 2: Fetch pricelist
    let pricelistText: string
    try {
      pricelistText = await fetchPricelistData(pricelistSheetId)
    } catch (err) {
      console.error('Pricelist fetch error:', err)
      return res.status(400).json({ 
        error: 'Не удалось получить прайс-лист из Google Таблицы.' 
      })
    }

    // Step 3: Generate via AI
    let generated
    try {
      generated = await generateEstimateFromPDF(pageDataUrls, pricelistText, comments || '')
    } catch (err) {
      console.error('AI generation error:', err)
      return res.status(500).json({ error: (err as Error).message || 'Ошибка генерации сметы через ИИ' })
    }

    // Step 4: Save to DB
    const id = uuidv4()
    const customerLinkToken = uuidv4()
    const masterLinkToken = uuidv4()
    const estimateTitle = title || generated.title || 'Смета (ИИ)'

    estimateQueries.create.run(id, req.user!.id, pricelistSheetId, estimateTitle, customerLinkToken, masterLinkToken, '{}')

    // Create default views
    const customerViewId = uuidv4()
    const masterViewId = uuidv4()
    viewQueries.create.run(customerViewId, id, 'Заказчик', customerLinkToken, null, 0)
    viewQueries.create.run(masterViewId, id, 'Мастер', masterLinkToken, null, 1)

    // Create sections and items
    let sectionOrder = 0
    for (const section of generated.sections) {
      const sectionId = uuidv4()
      sectionQueries.create.run(sectionId, id, section.name, sectionOrder++)

      // View section settings
      viewSectionSettingsQueries.upsert.run(uuidv4(), customerViewId, sectionId, 1)
      viewSectionSettingsQueries.upsert.run(uuidv4(), masterViewId, sectionId, 1)

      let itemOrder = 0
      for (const item of section.items) {
        const itemId = uuidv4()
        const customerTotal = item.quantity * item.customerPrice
        const masterTotal = item.quantity * item.masterPrice

        itemQueries.create.run(itemId, id, sectionId, String(itemOrder + 1), item.name, item.unit, item.quantity, itemOrder++)

        // View item settings
        viewItemSettingsQueries.upsert.run(uuidv4(), customerViewId, itemId, item.customerPrice, customerTotal, 1)
        viewItemSettingsQueries.upsert.run(uuidv4(), masterViewId, itemId, item.masterPrice, masterTotal, 1)
      }
    }

    const estimate = estimateQueries.findById.get(id) as EstimateRow
    res.status(201).json(buildEstimateResponse(estimate))
  } catch (error) {
    console.error('Generate estimate error:', error)
    res.status(500).json({ error: 'Ошибка генерации сметы' })
  }
})

// ========== GET ALL ESTIMATES ==========

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimates = estimateQueries.findByBrigadirId.all(req.user!.id) as EstimateRow[]
    
    res.json(estimates.map(e => {
      const views = viewQueries.findByEstimateId.all(e.id) as ViewRow[]
      return {
        id: e.id,
        title: e.title,
        googleSheetId: e.google_sheet_id,
        lastSyncedAt: e.last_synced_at,
        createdAt: e.created_at,
        views: views.map(v => ({
          id: v.id,
          name: v.name,
          linkToken: v.link_token,
          password: v.password || '',
          sortOrder: v.sort_order,
        })),
      }
    }))
  } catch (error) {
    console.error('Get estimates error:', error)
    res.status(500).json({ error: 'Ошибка получения смет' })
  }
})

// ========== GET SINGLE ESTIMATE ==========

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    res.json(buildEstimateResponse(estimate))
  } catch (error) {
    console.error('Get estimate error:', error)
    res.status(500).json({ error: 'Ошибка получения сметы' })
  }
})

// ========== CREATE PROJECT ==========

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, googleSheetUrl } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Название проекта обязательно' })
    }

    const id = uuidv4()
    const customerLinkToken = uuidv4()
    const masterLinkToken = uuidv4()

    let googleSheetId = ''

    if (googleSheetUrl) {
      try {
        googleSheetId = extractSheetIdFromUrl(googleSheetUrl)
      } catch (err) {
        return res.status(400).json({ error: (err as Error).message })
      }

      let rows: string[][]
      try {
        rows = await fetchSheetData(googleSheetId)
      } catch (err) {
        console.error('Sheet access error:', err)
        return res.status(400).json({ 
          error: 'Не удалось получить доступ к таблице.' 
        })
      }

      estimateQueries.create.run(id, req.user!.id, googleSheetId, title, customerLinkToken, masterLinkToken, '{}')

      // Create default views
      const customerViewId = uuidv4()
      const masterViewId = uuidv4()
      viewQueries.create.run(customerViewId, id, 'Заказчик', customerLinkToken, null, 0)
      viewQueries.create.run(masterViewId, id, 'Мастер', masterLinkToken, null, 1)

      syncEstimateItems(id, rows, customerViewId, masterViewId)
      estimateQueries.updateLastSynced.run(id)
    } else {
      estimateQueries.create.run(id, req.user!.id, '', title, customerLinkToken, masterLinkToken, '{}')

      // Create default views
      viewQueries.create.run(uuidv4(), id, 'Заказчик', customerLinkToken, null, 0)
      viewQueries.create.run(uuidv4(), id, 'Мастер', masterLinkToken, null, 1)
    }

    const estimate = estimateQueries.findById.get(id) as EstimateRow
    res.status(201).json(buildEstimateResponse(estimate))
  } catch (error) {
    console.error('Create project error:', error)
    res.status(500).json({ error: 'Ошибка создания проекта' })
  }
})

// ========== SYNC WITH GOOGLE SHEETS ==========

router.post('/:id/sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Проект не найден' })
    }

    if (!estimate.google_sheet_id) {
      return res.status(400).json({ error: 'Проект не привязан к Google таблице' })
    }

    const rows = await fetchSheetData(estimate.google_sheet_id)
    
    // Clear existing items, sections, and their view settings
    itemQueries.deleteByEstimateId.run(estimate.id)
    sectionQueries.deleteByEstimateId.run(estimate.id)
    
    // Get first two views for customer/master mapping during sync
    const views = viewQueries.findByEstimateId.all(estimate.id) as ViewRow[]
    const customerViewId = views.length > 0 ? views[0].id : null
    const masterViewId = views.length > 1 ? views[1].id : null

    syncEstimateItems(estimate.id, rows, customerViewId, masterViewId)
    estimateQueries.updateLastSynced.run(estimate.id)

    res.json({ message: 'Синхронизация завершена', syncedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ error: 'Ошибка синхронизации' })
  }
})

// ========== SECTION CRUD ==========

router.put('/:id/sections/:sectionId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    sectionQueries.update.run(name, req.params.sectionId)
    res.json({ success: true })
  } catch (error) {
    console.error('Update section error:', error)
    res.status(500).json({ error: 'Ошибка обновления раздела' })
  }
})

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

    sectionQueries.create.run(id, estimate.id, name, maxOrder + 1)

    // Create view settings for all views
    createViewSettingsForNewSection(estimate.id, id)

    res.status(201).json({ id, name, items: [] })
  } catch (error) {
    console.error('Add section error:', error)
    res.status(500).json({ error: 'Ошибка добавления раздела' })
  }
})

router.delete('/:id/sections/:sectionId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Проект не найден' })
    }

    // Delete items in section first (cascades view settings)
    const items = itemQueries.findBySectionId.all(req.params.sectionId) as ItemRow[]
    for (const item of items) {
      viewItemSettingsQueries.deleteByItemId.run(item.id)
      itemQueries.delete.run(item.id)
    }

    // Delete section view settings
    viewSectionSettingsQueries.deleteBySectionId.run(req.params.sectionId)
    sectionQueries.delete.run(req.params.sectionId)
    res.status(204).send()
  } catch (error) {
    console.error('Delete section error:', error)
    res.status(500).json({ error: 'Ошибка удаления раздела' })
  }
})

// ========== ITEM CRUD ==========

router.put('/:id/items/:itemId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, unit, quantity } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    itemQueries.update.run(name, unit, quantity, req.params.itemId)

    // Recalculate totals for all view settings of this item
    const viewSettings = viewItemSettingsQueries.findByItemId.all(req.params.itemId) as ViewItemSettingRow[]
    for (const vs of viewSettings) {
      const newTotal = (quantity || 0) * vs.price
      viewItemSettingsQueries.upsert.run(vs.id, vs.view_id, vs.item_id, vs.price, newTotal, vs.visible)
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Update item error:', error)
    res.status(500).json({ error: 'Ошибка обновления позиции' })
  }
})

router.post('/:id/items', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { sectionId, name, unit, quantity } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const id = uuidv4()

    // Get max sort order
    const items = itemQueries.findBySectionId.all(sectionId) as ItemRow[]
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : 0

    itemQueries.create.run(id, estimate.id, sectionId, '', name, unit || '', quantity || 0, maxOrder + 1)

    // Create view settings for all views
    createViewSettingsForNewItem(estimate.id, id)

    res.status(201).json({ 
      id,
      name,
      unit: unit || '',
      quantity: quantity || 0,
      sortOrder: maxOrder + 1,
    })
  } catch (error) {
    console.error('Add item error:', error)
    res.status(500).json({ error: 'Ошибка добавления позиции' })
  }
})

router.delete('/:id/items/:itemId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    viewItemSettingsQueries.deleteByItemId.run(req.params.itemId)
    itemQueries.delete.run(req.params.itemId)
    res.status(204).send()
  } catch (error) {
    console.error('Delete item error:', error)
    res.status(500).json({ error: 'Ошибка удаления позиции' })
  }
})

// ========== VIEW CRUD ==========

router.get('/:id/views', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const views = viewQueries.findByEstimateId.all(estimate.id) as ViewRow[]
    res.json(views.map(v => ({
      id: v.id,
      name: v.name,
      linkToken: v.link_token,
      password: v.password || '',
      sortOrder: v.sort_order,
    })))
  } catch (error) {
    console.error('Get views error:', error)
    res.status(500).json({ error: 'Ошибка получения представлений' })
  }
})

router.post('/:id/views', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const viewId = uuidv4()
    const linkToken = uuidv4()
    const maxOrder = (viewQueries.getMaxSortOrder.get(estimate.id) as { max_order: number }).max_order

    viewQueries.create.run(viewId, estimate.id, name || 'Новое представление', linkToken, null, maxOrder + 1)

    // Create section settings for all existing sections (visible by default)
    const sections = sectionQueries.findByEstimateId.all(estimate.id) as SectionRow[]
    for (const section of sections) {
      viewSectionSettingsQueries.upsert.run(uuidv4(), viewId, section.id, 1)
    }

    // Create item settings for all existing items (price=0, visible by default)
    const items = itemQueries.findByEstimateId.all(estimate.id) as ItemRow[]
    for (const item of items) {
      viewItemSettingsQueries.upsert.run(uuidv4(), viewId, item.id, 0, 0, 1)
    }

    res.status(201).json({
      id: viewId,
      name: name || 'Новое представление',
      linkToken,
      password: '',
      sortOrder: maxOrder + 1,
    })
  } catch (error) {
    console.error('Create view error:', error)
    res.status(500).json({ error: 'Ошибка создания представления' })
  }
})

router.put('/:id/views/:viewId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name, password } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const view = viewQueries.findById.get(req.params.viewId) as ViewRow | undefined
    if (!view || view.estimate_id !== estimate.id) {
      return res.status(404).json({ error: 'Представление не найдено' })
    }

    const newPassword = password !== undefined ? (password.trim() || null) : view.password
    viewQueries.update.run(name || view.name, newPassword, req.params.viewId)

    res.json({ 
      success: true,
      id: view.id,
      name: name || view.name,
      linkToken: view.link_token,
      password: newPassword || '',
      sortOrder: view.sort_order,
    })
  } catch (error) {
    console.error('Update view error:', error)
    res.status(500).json({ error: 'Ошибка обновления представления' })
  }
})

// ========== DUPLICATE VIEW ==========
router.post('/:id/views/:viewId/duplicate', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const sourceView = viewQueries.findById.get(req.params.viewId) as ViewRow | undefined
    if (!sourceView || sourceView.estimate_id !== estimate.id) {
      return res.status(404).json({ error: 'Представление не найдено' })
    }

    const newViewId = uuidv4()
    const newLinkToken = uuidv4()
    const maxOrder = (viewQueries.getMaxSortOrder.get(estimate.id) as { max_order: number }).max_order
    const newName = `${sourceView.name} (копия)`

    viewQueries.create.run(newViewId, estimate.id, newName, newLinkToken, null, maxOrder + 1)

    // Copy section settings from source view
    const sourceSectionSettings = viewSectionSettingsQueries.findByViewId.all(sourceView.id) as ViewSectionSettingRow[]
    for (const ss of sourceSectionSettings) {
      viewSectionSettingsQueries.upsert.run(uuidv4(), newViewId, ss.section_id, ss.visible)
    }

    // Copy item settings from source view (with prices!)
    const sourceItemSettings = viewItemSettingsQueries.findByViewId.all(sourceView.id) as ViewItemSettingRow[]
    for (const is of sourceItemSettings) {
      viewItemSettingsQueries.upsert.run(uuidv4(), newViewId, is.item_id, is.price, is.total, is.visible)
    }

    res.status(201).json({
      id: newViewId,
      name: newName,
      linkToken: newLinkToken,
      password: '',
      sortOrder: maxOrder + 1,
    })
  } catch (error) {
    console.error('Duplicate view error:', error)
    res.status(500).json({ error: 'Ошибка дублирования представления' })
  }
})

router.delete('/:id/views/:viewId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const view = viewQueries.findById.get(req.params.viewId) as ViewRow | undefined
    if (!view || view.estimate_id !== estimate.id) {
      return res.status(404).json({ error: 'Представление не найдено' })
    }

    // Check minimum: must have at least 1 view
    const views = viewQueries.findByEstimateId.all(estimate.id) as ViewRow[]
    if (views.length <= 1) {
      return res.status(400).json({ error: 'Нельзя удалить последнее представление' })
    }

    // Delete view settings first (CASCADE should handle, but be safe)
    viewSectionSettingsQueries.deleteByViewId.run(req.params.viewId)
    viewItemSettingsQueries.deleteByViewId.run(req.params.viewId)
    viewQueries.delete.run(req.params.viewId)

    res.status(204).send()
  } catch (error) {
    console.error('Delete view error:', error)
    res.status(500).json({ error: 'Ошибка удаления представления' })
  }
})

// ========== VIEW SECTION/ITEM SETTINGS ==========

router.put('/:id/views/:viewId/sections/:sectionId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { visible } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    viewSectionSettingsQueries.upsert.run(
      uuidv4(), req.params.viewId, req.params.sectionId, visible ? 1 : 0
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Update view section setting error:', error)
    res.status(500).json({ error: 'Ошибка обновления' })
  }
})

router.put('/:id/views/:viewId/items/:itemId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { price, visible } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    // Get current item quantity for total calculation
    const item = itemQueries.findById.get(req.params.itemId) as ItemRow | undefined
    if (!item) {
      return res.status(404).json({ error: 'Позиция не найдена' })
    }

    // Get existing setting to merge
    const existing = viewItemSettingsQueries.findByViewAndItem.get(req.params.viewId, req.params.itemId) as ViewItemSettingRow | undefined
    
    const newPrice = price !== undefined ? price : (existing?.price || 0)
    const newVisible = visible !== undefined ? (visible ? 1 : 0) : (existing?.visible ?? 1)
    const newTotal = item.quantity * newPrice

    viewItemSettingsQueries.upsert.run(
      uuidv4(), req.params.viewId, req.params.itemId, newPrice, newTotal, newVisible
    )

    res.json({ success: true, price: newPrice, total: newTotal, visible: Boolean(newVisible) })
  } catch (error) {
    console.error('Update view item setting error:', error)
    res.status(500).json({ error: 'Ошибка обновления' })
  }
})

// ========== PUBLIC VIEW (UNIVERSAL) ==========

function buildPublicViewData(view: ViewRow) {
  const estimate = estimateQueries.findById.get(view.estimate_id) as EstimateRow
  const sections = sectionQueries.findByEstimateId.all(view.estimate_id) as SectionRow[]
  const items = itemQueries.findByEstimateId.all(view.estimate_id) as ItemRow[]
  const sectionSettings = viewSectionSettingsQueries.findByViewId.all(view.id) as ViewSectionSettingRow[]
  const itemSettings = viewItemSettingsQueries.findByViewId.all(view.id) as ViewItemSettingRow[]

  // Build maps
  const sectionVisMap = new Map<string, boolean>()
  for (const s of sectionSettings) sectionVisMap.set(s.section_id, Boolean(s.visible))
  
  const itemSettingsMap = new Map<string, { price: number; total: number; visible: boolean }>()
  for (const i of itemSettings) itemSettingsMap.set(i.item_id, { price: i.price, total: i.total, visible: Boolean(i.visible) })

  const visibleSections = sections
    .filter(s => sectionVisMap.get(s.id) !== false) // default visible
    .map(section => {
      let itemNumber = 1
      const sectionItems = items
        .filter(item => {
          if (item.section_id !== section.id) return false
          const settings = itemSettingsMap.get(item.id)
          return !settings || settings.visible
        })
        .map(item => {
          const settings = itemSettingsMap.get(item.id) || { price: 0, total: 0 }
          return {
            number: String(itemNumber++),
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            price: settings.price,
            total: settings.total,
          }
        })
      
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
    viewName: view.name,
    sections: visibleSections,
    total,
  }
}

router.get('/view/:token', async (_req: AuthRequest, res: Response) => {
  try {
    const view = viewQueries.findByLinkToken.get(_req.params.token) as ViewRow | undefined
    
    if (!view) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    if (view.password) {
      const estimate = estimateQueries.findById.get(view.estimate_id) as EstimateRow
      return res.json({
        requiresPassword: true,
        title: estimate.title,
        viewName: view.name,
      })
    }

    res.json(buildPublicViewData(view))
  } catch (error) {
    console.error('Public view error:', error)
    res.status(500).json({ error: 'Ошибка загрузки сметы' })
  }
})

router.post('/view/:token/verify', async (_req: AuthRequest, res: Response) => {
  try {
    const { password } = _req.body
    const view = viewQueries.findByLinkToken.get(_req.params.token) as ViewRow | undefined
    
    if (!view) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    if (view.password && view.password !== (password || '').trim()) {
      return res.status(403).json({ error: 'Неверная кодовая фраза' })
    }

    res.json(buildPublicViewData(view))
  } catch (error) {
    console.error('Public view verify error:', error)
    res.status(500).json({ error: 'Ошибка загрузки сметы' })
  }
})

// Legacy compatibility: /customer/:token and /master/:token
router.get('/customer/:token', async (_req: AuthRequest, res: Response) => {
  try {
    const view = viewQueries.findByLinkToken.get(_req.params.token) as ViewRow | undefined
    if (!view) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }
    res.json(buildPublicViewData(view))
  } catch (error) {
    console.error('Customer view error:', error)
    res.status(500).json({ error: 'Ошибка загрузки сметы' })
  }
})

router.get('/master/:token', async (_req: AuthRequest, res: Response) => {
  try {
    const view = viewQueries.findByLinkToken.get(_req.params.token) as ViewRow | undefined
    if (!view) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }
    if (view.password) {
      const estimate = estimateQueries.findById.get(view.estimate_id) as EstimateRow
      return res.json({ requiresPassword: true, title: estimate.title })
    }
    res.json(buildPublicViewData(view))
  } catch (error) {
    console.error('Master view error:', error)
    res.status(500).json({ error: 'Ошибка загрузки сметы' })
  }
})

router.post('/master/:token/verify', async (_req: AuthRequest, res: Response) => {
  try {
    const { password } = _req.body
    const view = viewQueries.findByLinkToken.get(_req.params.token) as ViewRow | undefined
    if (!view) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }
    if (view.password && view.password !== (password || '').trim()) {
      return res.status(403).json({ error: 'Неверная кодовая фраза' })
    }
    res.json(buildPublicViewData(view))
  } catch (error) {
    console.error('Master verify error:', error)
    res.status(500).json({ error: 'Ошибка загрузки сметы' })
  }
})

// ========== UPDATE PROJECT ==========

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, googleSheetUrl } = req.body
    const { id } = req.params

    if (!title) {
      return res.status(400).json({ error: 'Название проекта обязательно' })
    }

    let googleSheetId = ''
    if (googleSheetUrl) {
      try {
        googleSheetId = extractSheetIdFromUrl(googleSheetUrl)
      } catch (err) {
        return res.status(400).json({ error: (err as Error).message })
      }
    }

    const result = estimateQueries.update.run(googleSheetId, title, id, req.user!.id)
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Проект не найден' })
    }

    const estimate = estimateQueries.findById.get(id) as EstimateRow
    res.json(buildEstimateResponse(estimate))
  } catch (error) {
    console.error('Update project error:', error)
    res.status(500).json({ error: 'Ошибка обновления проекта' })
  }
})

// ========== DELETE ESTIMATE ==========

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

// ========== VERSION CONTROL ==========

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

router.post('/:id/versions', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const maxVersion = versionQueries.getMaxVersionNumber.get(estimate.id) as { max_version: number }
    const versionNumber = maxVersion.max_version + 1
    const versionId = uuidv4()
    versionQueries.create.run(versionId, estimate.id, versionNumber, name || null)

    // Snapshot sections and items
    const sections = sectionQueries.findByEstimateId.all(estimate.id) as SectionRow[]
    const items = itemQueries.findByEstimateId.all(estimate.id) as ItemRow[]
    const views = viewQueries.findByEstimateId.all(estimate.id) as ViewRow[]

    const sectionIdMap = new Map<string, string>() // original -> version
    const itemIdMap = new Map<string, string>() // original -> version

    for (const section of sections) {
      const versionSectionId = uuidv4()
      sectionIdMap.set(section.id, versionSectionId)
      versionSectionQueries.create.run(versionSectionId, versionId, section.id, section.name, section.sort_order)
    }

    for (const item of items) {
      const versionSectionId = sectionIdMap.get(item.section_id)
      if (!versionSectionId) continue
      const versionItemId = uuidv4()
      itemIdMap.set(item.id, versionItemId)
      versionItemQueries.create.run(versionItemId, versionId, versionSectionId, item.id, item.number, item.name, item.unit, item.quantity, item.sort_order)
    }

    // Snapshot views and their settings
    const viewIdMap = new Map<string, string>()
    for (const view of views) {
      const versionViewId = uuidv4()
      viewIdMap.set(view.id, versionViewId)
      versionViewQueries.create.run(versionViewId, versionId, view.id, view.name, view.sort_order)

      // Snapshot section settings
      const sectionSettings = viewSectionSettingsQueries.findByViewId.all(view.id) as ViewSectionSettingRow[]
      for (const ss of sectionSettings) {
        const vSectionId = sectionIdMap.get(ss.section_id)
        if (!vSectionId) continue
        versionViewSectionSettingsQueries.create.run(uuidv4(), versionId, versionViewId, vSectionId, ss.visible)
      }

      // Snapshot item settings
      const itemSettings = viewItemSettingsQueries.findByViewId.all(view.id) as ViewItemSettingRow[]
      for (const is_ of itemSettings) {
        const vItemId = itemIdMap.get(is_.item_id)
        if (!vItemId) continue
        versionViewItemSettingsQueries.create.run(uuidv4(), versionId, versionViewId, vItemId, is_.price, is_.total, is_.visible)
      }
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
    const views = versionViewQueries.findByVersionId.all(version.id) as VersionViewRow[]
    const viewSectionSettings = versionViewSectionSettingsQueries.findByVersionId.all(version.id) as VersionViewSectionSettingRow[]
    const viewItemSettings = versionViewItemSettingsQueries.findByVersionId.all(version.id) as VersionViewItemSettingRow[]

    // Build view settings maps
    const sectionViewMap = new Map<string, Record<string, { visible: boolean }>>()
    for (const s of viewSectionSettings) {
      if (!sectionViewMap.has(s.version_section_id)) sectionViewMap.set(s.version_section_id, {})
      sectionViewMap.get(s.version_section_id)![s.version_view_id] = { visible: Boolean(s.visible) }
    }
    const itemViewMap = new Map<string, Record<string, { price: number; total: number; visible: boolean }>>()
    for (const i of viewItemSettings) {
      if (!itemViewMap.has(i.version_item_id)) itemViewMap.set(i.version_item_id, {})
      itemViewMap.get(i.version_item_id)![i.version_view_id] = { price: i.price, total: i.total, visible: Boolean(i.visible) }
    }

    const sectionsWithItems = sections.map(section => ({
      id: section.id,
      name: section.name,
      sortOrder: section.sort_order,
      viewSettings: sectionViewMap.get(section.id) || {},
      items: items
        .filter(item => item.version_section_id === section.id)
        .map(item => ({
          id: item.id,
          number: item.number,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          sortOrder: item.sort_order,
          viewSettings: itemViewMap.get(item.id) || {},
        })),
    }))

    res.json({
      id: version.id,
      versionNumber: version.version_number,
      name: version.name,
      createdAt: version.created_at,
      views: views.map(v => ({ id: v.id, name: v.name, sortOrder: v.sort_order })),
      sections: sectionsWithItems,
    })
  } catch (error) {
    console.error('Get version error:', error)
    res.status(500).json({ error: 'Ошибка получения версии' })
  }
})

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
    const versionViews = versionViewQueries.findByVersionId.all(version.id) as VersionViewRow[]
    const versionViewSectionSettings = versionViewSectionSettingsQueries.findByVersionId.all(version.id) as VersionViewSectionSettingRow[]
    const versionViewItemSettings = versionViewItemSettingsQueries.findByVersionId.all(version.id) as VersionViewItemSettingRow[]

    // Delete current data
    itemQueries.deleteByEstimateId.run(estimate.id)
    sectionQueries.deleteByEstimateId.run(estimate.id)
    // Views: delete all and recreate from version
    viewQueries.deleteByEstimateId.run(estimate.id)

    // Restore views
    const viewIdMap = new Map<string, string>() // version_view_id -> new_view_id
    for (const vView of versionViews) {
      const newViewId = uuidv4()
      viewIdMap.set(vView.id, newViewId)
      viewQueries.create.run(newViewId, estimate.id, vView.name, uuidv4(), null, vView.sort_order)
    }

    // Restore sections
    const sectionIdMap = new Map<string, string>() // version_section_id -> new_section_id
    for (const vSection of versionSections) {
      const newSectionId = uuidv4()
      sectionIdMap.set(vSection.id, newSectionId)
      sectionQueries.create.run(newSectionId, estimate.id, vSection.name, vSection.sort_order)
    }

    // Restore items
    const itemIdMap = new Map<string, string>() // version_item_id -> new_item_id
    for (const vItem of versionItems) {
      const newSectionId = sectionIdMap.get(vItem.version_section_id)
      if (!newSectionId) continue
      const newItemId = uuidv4()
      itemIdMap.set(vItem.id, newItemId)
      itemQueries.create.run(newItemId, estimate.id, newSectionId, vItem.number, vItem.name, vItem.unit, vItem.quantity, vItem.sort_order)
    }

    // Restore view section settings
    for (const vss of versionViewSectionSettings) {
      const newViewId = viewIdMap.get(vss.version_view_id)
      const newSectionId = sectionIdMap.get(vss.version_section_id)
      if (!newViewId || !newSectionId) continue
      viewSectionSettingsQueries.upsert.run(uuidv4(), newViewId, newSectionId, vss.visible)
    }

    // Restore view item settings
    for (const vis of versionViewItemSettings) {
      const newViewId = viewIdMap.get(vis.version_view_id)
      const newItemId = itemIdMap.get(vis.version_item_id)
      if (!newViewId || !newItemId) continue
      viewItemSettingsQueries.upsert.run(uuidv4(), newViewId, newItemId, vis.price, vis.total, vis.visible)
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

// ========== ACT IMAGES ==========

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

router.post('/:id/act-images', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { imageType, data } = req.body
    
    if (!imageType || !data) {
      return res.status(400).json({ error: 'Тип изображения и данные обязательны' })
    }

    if (!['logo', 'stamp', 'signature'].includes(imageType)) {
      return res.status(400).json({ error: 'Неверный тип изображения' })
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

// ========== HELPER: Sync items from Google Sheets ==========

function syncEstimateItems(estimateId: string, rows: string[][], customerViewId: string | null, masterViewId: string | null) {
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
    sectionQueries.create.run(sectionId, estimateId, section.name, sectionOrder++)

    // Create section visibility for views
    if (customerViewId) {
      viewSectionSettingsQueries.upsert.run(uuidv4(), customerViewId, sectionId, 1)
    }
    if (masterViewId) {
      viewSectionSettingsQueries.upsert.run(uuidv4(), masterViewId, sectionId, 1)
    }
    // Also create for any other views
    const allViews = viewQueries.findByEstimateId.all(estimateId) as ViewRow[]
    for (const view of allViews) {
      if (view.id !== customerViewId && view.id !== masterViewId) {
        viewSectionSettingsQueries.upsert.run(uuidv4(), view.id, sectionId, 1)
      }
    }

    let itemOrder = 0
    for (const item of section.items) {
      const masterInfo = masterPriceMap.get(`${section.name}:${item.name}`) || { price: 0, total: 0 }
      const itemId = uuidv4()
      
      itemQueries.create.run(itemId, estimateId, sectionId, item.number, item.name, item.unit, item.quantity, itemOrder++)

      // Create item settings for customer view
      if (customerViewId) {
        viewItemSettingsQueries.upsert.run(uuidv4(), customerViewId, itemId, item.price, item.total, 1)
      }
      // Create item settings for master view
      if (masterViewId) {
        viewItemSettingsQueries.upsert.run(uuidv4(), masterViewId, itemId, masterInfo.price, masterInfo.total, masterInfo.total > 0 ? 1 : 0)
      }
      // Create item settings for any other views
      for (const view of allViews) {
        if (view.id !== customerViewId && view.id !== masterViewId) {
          viewItemSettingsQueries.upsert.run(uuidv4(), view.id, itemId, 0, 0, 1)
        }
      }
    }
  }
}

export default router
