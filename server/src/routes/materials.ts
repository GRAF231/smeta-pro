import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { estimateQueries, materialQueries } from '../models/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { parseProductsFromUrls } from '../services/openrouter'

const router = Router({ mergeParams: true })

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

interface MaterialRow {
  id: string
  estimate_id: string
  name: string
  article: string
  brand: string
  unit: string
  price: number
  quantity: number
  total: number
  url: string
  description: string
  sort_order: number
  created_at: string
  updated_at: string
}

function formatMaterial(m: MaterialRow) {
  return {
    id: m.id,
    estimateId: m.estimate_id,
    name: m.name,
    article: m.article,
    brand: m.brand,
    unit: m.unit,
    price: m.price,
    quantity: m.quantity,
    total: m.total,
    url: m.url,
    description: m.description,
    sortOrder: m.sort_order,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  }
}

// Helper: get estimateId from params (handles mergeParams type)
function getEstimateId(req: AuthRequest): string {
  return String(req.params.estimateId)
}

// Helper: verify estimate ownership
function getEstimateForUser(estimateId: string, userId: string): EstimateRow | null {
  const estimate = estimateQueries.findById.get(estimateId) as EstimateRow | undefined
  if (!estimate || estimate.brigadir_id !== userId) return null
  return estimate
}

// GET / — Get all materials for an estimate
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = getEstimateForUser(getEstimateId(req), req.user!.id)
    if (!estimate) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const materials = materialQueries.findByEstimateId.all(estimate.id) as MaterialRow[]
    res.json(materials.map(formatMaterial))
  } catch (error) {
    console.error('Get materials error:', error)
    res.status(500).json({ error: 'Ошибка получения материалов' })
  }
})

// POST /parse — Parse URLs and add materials via AI
router.post('/parse', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { urls } = req.body

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Необходимо указать хотя бы одну ссылку' })
    }

    // Limit to 20 URLs at a time
    if (urls.length > 20) {
      return res.status(400).json({ error: 'Максимум 20 ссылок за раз' })
    }

    const estimate = getEstimateForUser(getEstimateId(req), req.user!.id)
    if (!estimate) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    // Validate URLs
    const validUrls: string[] = []
    for (const url of urls) {
      const trimmed = String(url).trim()
      if (!trimmed) continue
      try {
        new URL(trimmed)
        validUrls.push(trimmed)
      } catch {
        // Skip invalid URLs
        console.warn(`[Materials] Skipping invalid URL: ${trimmed}`)
      }
    }

    if (validUrls.length === 0) {
      return res.status(400).json({ error: 'Не найдено ни одной корректной ссылки' })
    }

    // Parse products via AI
    const parsedProducts = await parseProductsFromUrls(validUrls)

    // Get current max sort order
    const maxOrderRow = materialQueries.getMaxSortOrder.get(estimate.id) as { max_order: number }
    let sortOrder = maxOrderRow.max_order

    // Save to DB
    const savedMaterials: ReturnType<typeof formatMaterial>[] = []

    for (const product of parsedProducts) {
      const id = uuidv4()
      sortOrder++
      const total = product.price * 1 // quantity defaults to 1

      materialQueries.create.run(
        id,
        estimate.id,
        product.name,
        product.article,
        product.brand,
        product.unit,
        product.price,
        1, // default quantity
        total,
        product.url,
        product.description,
        sortOrder
      )

      const saved = materialQueries.findById.get(id) as MaterialRow
      savedMaterials.push(formatMaterial(saved))
    }

    res.status(201).json(savedMaterials)
  } catch (error) {
    console.error('Parse materials error:', error)
    res.status(500).json({ error: (error as Error).message || 'Ошибка парсинга материалов' })
  }
})

// PUT /:materialId — Update a material (manual editing)
router.put('/:materialId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = getEstimateForUser(getEstimateId(req), req.user!.id)
    if (!estimate) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const material = materialQueries.findById.get(req.params.materialId) as MaterialRow | undefined
    if (!material || material.estimate_id !== estimate.id) {
      return res.status(404).json({ error: 'Материал не найден' })
    }

    const { name, article, brand, unit, price, quantity, url, description } = req.body
    const newPrice = price !== undefined ? Number(price) || 0 : material.price
    const newQuantity = quantity !== undefined ? Number(quantity) || 0 : material.quantity
    const total = newPrice * newQuantity

    materialQueries.update.run(
      name !== undefined ? name : material.name,
      article !== undefined ? article : material.article,
      brand !== undefined ? brand : material.brand,
      unit !== undefined ? unit : material.unit,
      newPrice,
      newQuantity,
      total,
      url !== undefined ? url : material.url,
      description !== undefined ? description : material.description,
      material.id
    )

    const updated = materialQueries.findById.get(material.id) as MaterialRow
    res.json(formatMaterial(updated))
  } catch (error) {
    console.error('Update material error:', error)
    res.status(500).json({ error: 'Ошибка обновления материала' })
  }
})

// DELETE /:materialId — Delete a material
router.delete('/:materialId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = getEstimateForUser(getEstimateId(req), req.user!.id)
    if (!estimate) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const material = materialQueries.findById.get(req.params.materialId) as MaterialRow | undefined
    if (!material || material.estimate_id !== estimate.id) {
      return res.status(404).json({ error: 'Материал не найден' })
    }

    materialQueries.delete.run(material.id)
    res.status(204).send()
  } catch (error) {
    console.error('Delete material error:', error)
    res.status(500).json({ error: 'Ошибка удаления материала' })
  }
})

// POST /refresh — Refresh all materials (re-parse URLs)
router.post('/refresh', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const estimate = getEstimateForUser(getEstimateId(req), req.user!.id)
    if (!estimate) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const materials = materialQueries.findByEstimateId.all(estimate.id) as MaterialRow[]
    const urlsToRefresh = materials.filter(m => m.url && m.url.trim()).map(m => ({ id: m.id, url: m.url, quantity: m.quantity }))

    if (urlsToRefresh.length === 0) {
      return res.json({ message: 'Нет материалов с ссылками для обновления', updated: 0 })
    }

    // Parse all URLs
    const parsedProducts = await parseProductsFromUrls(urlsToRefresh.map(u => u.url))

    // Update each material with new data
    let updatedCount = 0
    for (let i = 0; i < urlsToRefresh.length; i++) {
      const original = urlsToRefresh[i]
      const parsed = parsedProducts[i]
      if (!parsed || parsed.price === 0) continue

      const total = parsed.price * original.quantity

      materialQueries.update.run(
        parsed.name,
        parsed.article,
        parsed.brand,
        parsed.unit,
        parsed.price,
        original.quantity,
        total,
        parsed.url,
        parsed.description,
        original.id
      )
      updatedCount++
    }

    // Return updated list
    const updatedMaterials = materialQueries.findByEstimateId.all(estimate.id) as MaterialRow[]
    res.json({
      message: `Обновлено ${updatedCount} из ${urlsToRefresh.length} материалов`,
      updated: updatedCount,
      materials: updatedMaterials.map(formatMaterial),
    })
  } catch (error) {
    console.error('Refresh materials error:', error)
    res.status(500).json({ error: (error as Error).message || 'Ошибка актуализации материалов' })
  }
})

// POST /refresh/:materialId — Refresh one material
router.post('/refresh/:materialId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const estimate = getEstimateForUser(getEstimateId(req), req.user!.id)
    if (!estimate) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const material = materialQueries.findById.get(req.params.materialId) as MaterialRow | undefined
    if (!material || material.estimate_id !== estimate.id) {
      return res.status(404).json({ error: 'Материал не найден' })
    }

    if (!material.url || !material.url.trim()) {
      return res.status(400).json({ error: 'У материала нет ссылки для обновления' })
    }

    const parsedProducts = await parseProductsFromUrls([material.url])
    const parsed = parsedProducts[0]

    if (!parsed || parsed.price === 0) {
      return res.status(400).json({ error: 'Не удалось получить данные по ссылке' })
    }

    const total = parsed.price * material.quantity

    materialQueries.update.run(
      parsed.name,
      parsed.article,
      parsed.brand,
      parsed.unit,
      parsed.price,
      material.quantity,
      total,
      parsed.url,
      parsed.description,
      material.id
    )

    const updated = materialQueries.findById.get(material.id) as MaterialRow
    res.json(formatMaterial(updated))
  } catch (error) {
    console.error('Refresh material error:', error)
    res.status(500).json({ error: (error as Error).message || 'Ошибка актуализации материала' })
  }
})

export default router

