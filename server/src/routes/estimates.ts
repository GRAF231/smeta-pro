import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { estimateQueries } from '../models/database'
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
  created_at: string
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
      createdAt: e.created_at,
    })))
  } catch (error) {
    console.error('Get estimates error:', error)
    res.status(500).json({ error: 'Ошибка получения смет' })
  }
})

// Get single estimate
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findById.get(req.params.id) as EstimateRow | undefined
    
    if (!estimate || estimate.brigadir_id !== req.user!.id) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    res.json({
      id: estimate.id,
      title: estimate.title,
      googleSheetId: estimate.google_sheet_id,
      customerLinkToken: estimate.customer_link_token,
      masterLinkToken: estimate.master_link_token,
      createdAt: estimate.created_at,
    })
  } catch (error) {
    console.error('Get estimate error:', error)
    res.status(500).json({ error: 'Ошибка получения сметы' })
  }
})

// Create estimate
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

    // Verify the sheet is accessible
    try {
      await fetchSheetData(googleSheetId)
    } catch (err) {
      console.error('Sheet access error:', err)
      return res.status(400).json({ 
        error: 'Не удалось получить доступ к таблице. Убедитесь, что таблица открыта для сервисного аккаунта.' 
      })
    }

    const id = uuidv4()
    const customerLinkToken = uuidv4()
    const masterLinkToken = uuidv4()
    const columnMapping = JSON.stringify({})

    estimateQueries.create.run(
      id,
      req.user!.id,
      googleSheetId,
      title,
      customerLinkToken,
      masterLinkToken,
      columnMapping
    )

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

// Get customer view (public)
router.get('/customer/:token', async (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findByCustomerToken.get(req.params.token) as EstimateRow | undefined
    
    if (!estimate) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const rows = await fetchSheetData(estimate.google_sheet_id)
    const data = parseEstimateData(rows, 'customer')
    data.title = estimate.title

    res.json(data)
  } catch (error) {
    console.error('Customer view error:', error)
    res.status(500).json({ error: 'Ошибка загрузки сметы' })
  }
})

// Get master view (public)
router.get('/master/:token', async (req: AuthRequest, res: Response) => {
  try {
    const estimate = estimateQueries.findByMasterToken.get(req.params.token) as EstimateRow | undefined
    
    if (!estimate) {
      return res.status(404).json({ error: 'Смета не найдена' })
    }

    const rows = await fetchSheetData(estimate.google_sheet_id)
    const data = parseEstimateData(rows, 'master')
    data.title = estimate.title

    res.json(data)
  } catch (error) {
    console.error('Master view error:', error)
    res.status(500).json({ error: 'Ошибка загрузки сметы' })
  }
})

export default router

