import { Router } from 'express'
import multer from 'multer'
import { estimateController } from '../controllers/estimate.controller'
import { viewController } from '../controllers/view.controller'
import { versionController } from '../controllers/version.controller'
import { actController } from '../controllers/act.controller'
import { paymentController } from '../controllers/payment.controller'
import { publicController } from '../controllers/public.controller'
import { yookassaController } from '../controllers/yookassa.controller'
import { authMiddleware } from '../middleware/auth'

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

// Public routes (no authentication)
router.get('/view/:token', publicController.getPublicView)
router.post('/view/:token/verify', publicController.verifyPassword)
router.get('/customer/:token', publicController.getCustomerView)
router.get('/master/:token', publicController.getMasterView)
router.post('/master/:token/verify', publicController.verifyMasterPassword)

// All other routes require authentication
router.use(authMiddleware)

// Estimate CRUD
router.get('/', estimateController.getEstimates)
router.post('/', estimateController.createEstimate)
router.post('/generate', upload.single('pdf'), estimateController.generateFromPDF)
router.post('/test-classification', upload.single('pdf'), estimateController.testPageClassification)
router.post('/test-structure-analysis', upload.single('pdf'), estimateController.testStructureAnalysis)
router.post('/test-room-data-extraction', upload.single('pdf'), estimateController.testRoomDataExtraction)
router.get('/:id', estimateController.getEstimate)
router.put('/:id', estimateController.updateEstimate)
router.delete('/:id', estimateController.deleteEstimate)
router.post('/:id/sync', estimateController.syncEstimate)

// Sections
router.post('/:id/sections', estimateController.createSection)
router.put('/:id/sections/:sectionId', estimateController.updateSection)
router.delete('/:id/sections/:sectionId', estimateController.deleteSection)

// Items
router.post('/:id/items', estimateController.createItem)
router.put('/:id/items/:itemId', estimateController.updateItem)
router.delete('/:id/items/:itemId', estimateController.deleteItem)

// Views
router.get('/:id/views', viewController.getViews)
router.post('/:id/views', viewController.createView)
router.put('/:id/views/:viewId', viewController.updateView)
router.post('/:id/views/:viewId/duplicate', viewController.duplicateView)
router.delete('/:id/views/:viewId', viewController.deleteView)
router.post('/:id/views/:viewId/set-customer-view', viewController.setCustomerView)
router.put('/:id/views/:viewId/sections/:sectionId', viewController.updateSectionSettings)
router.put('/:id/views/:viewId/items/:itemId', viewController.updateItemSettings)

// Versions
router.get('/:id/versions', versionController.getVersions)
router.post('/:id/versions', versionController.createVersion)
router.get('/:id/versions/:versionId', versionController.getVersion)
router.post('/:id/versions/:versionId/restore', versionController.restoreVersion)

// Acts
router.get('/:id/acts', actController.getActs)
router.get('/:id/acts/used-items', actController.getUsedItems)
router.post('/:id/acts', actController.createAct)
router.get('/:id/acts/:actId', actController.getAct)
router.delete('/:id/acts/:actId', actController.deleteAct)

// Act Images
router.get('/:id/act-images', actController.getActImages)
router.post('/:id/act-images', actController.uploadActImage)
router.delete('/:id/act-images/:imageType', actController.deleteActImage)

// Payments
router.get('/:id/payments', paymentController.getPayments)
router.post('/:id/payments', paymentController.createPayment)
router.post('/:id/payments/invoice', paymentController.createInvoice)
router.get('/:id/payments/:paymentId', paymentController.getPayment)
router.post('/:id/payments/:paymentId/check-status', paymentController.checkPaymentStatus)
router.delete('/:id/payments/:paymentId', paymentController.deletePayment)
router.get('/:id/item-statuses', paymentController.getItemStatuses)

export default router

