import { Router } from 'express'
import { materialController } from '../controllers/material.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router({ mergeParams: true })

// All routes require authentication
router.use(authMiddleware)

router.get('/', materialController.getMaterials)
router.post('/parse', materialController.parseMaterials)
router.put('/:materialId', materialController.updateMaterial)
router.delete('/:materialId', materialController.deleteMaterial)
router.post('/refresh', materialController.refreshMaterials)
router.post('/refresh/:materialId', materialController.refreshMaterial)

export default router

