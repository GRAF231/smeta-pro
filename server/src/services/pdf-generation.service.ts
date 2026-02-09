import { v4 as uuidv4 } from 'uuid'
import { PDFParse } from 'pdf-parse'
import sharp from 'sharp'
import { estimateRepository } from '../repositories/estimate.repository'
import { sectionRepository } from '../repositories/section.repository'
import { itemRepository } from '../repositories/item.repository'
import {
  viewRepository,
  viewSectionSettingsRepository,
  viewItemSettingsRepository,
} from '../repositories/view.repository'
import { EstimateResponse } from '../types/estimate'
import { extractSheetIdFromUrl, fetchPricelistData } from '../services/googleSheets'
import { generateEstimateFromPDF } from '../services/openrouter'
import { estimateService } from './estimate.service'

/**
 * Сервис для генерации смет из PDF
 */
export class PdfGenerationService {
  /**
   * Генерировать смету из PDF файла
   */
  async generateEstimateFromPDF(
    userId: string,
    pdfBuffer: Buffer,
    title: string,
    pricelistUrl: string,
    comments?: string
  ): Promise<EstimateResponse> {
    // Extract sheet ID from pricelist URL
    const pricelistSheetId = extractSheetIdFromUrl(pricelistUrl)

    // Step 1: Convert PDF pages to images
    let pageDataUrls: string[]
    const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) })
    try {
      const screenshotResult = await parser.getScreenshot({
        imageDataUrl: false,
        imageBuffer: true,
        desiredWidth: 800,
      })

      const totalPages = screenshotResult.total
      if (!screenshotResult.pages || screenshotResult.pages.length === 0) {
        throw new Error(
          'Не удалось обработать PDF. Убедитесь, что файл не поврежден.'
        )
      }

      console.log(
        `[PDF] Got ${screenshotResult.pages.length} of ${totalPages} pages, converting to JPEG...`
      )

      pageDataUrls = []
      for (let i = 0; i < screenshotResult.pages.length; i++) {
        const page = screenshotResult.pages[i]
        const jpegBuffer = await sharp(Buffer.from(page.data))
          .jpeg({ quality: 65 })
          .toBuffer()
        pageDataUrls.push(
          `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`
        )
        ;(page as any).data = null
        if ((i + 1) % 10 === 0) {
          console.log(
            `[PDF] Converted ${i + 1}/${screenshotResult.pages.length} pages to JPEG`
          )
        }
      }

      const totalSizeMB =
        pageDataUrls.reduce((sum, url) => sum + url.length, 0) / (1024 * 1024)
      console.log(
        `[PDF] Converted ${pageDataUrls.length} pages to JPEG (total ~${totalSizeMB.toFixed(1)} MB base64)`
      )
    } catch (err) {
      console.error('PDF screenshot error:', err)
      throw new Error(
        'Ошибка обработки PDF файла. Убедитесь, что файл не поврежден.'
      )
    } finally {
      await parser.destroy().catch(() => {})
    }

    // Step 2: Fetch pricelist
    let pricelistText: string
    try {
      pricelistText = await fetchPricelistData(pricelistSheetId)
    } catch (err) {
      console.error('Pricelist fetch error:', err)
      throw new Error('Не удалось получить прайс-лист из Google Таблицы.')
    }

    // Step 3: Generate via AI
    let generated
    try {
      generated = await generateEstimateFromPDF(
        pageDataUrls,
        pricelistText,
        comments || ''
      )
    } catch (err) {
      console.error('AI generation error:', err)
      throw new Error(
        (err as Error).message || 'Ошибка генерации сметы через ИИ'
      )
    }

    // Step 4: Save to DB
    const id = uuidv4()
    const customerLinkToken = uuidv4()
    const masterLinkToken = uuidv4()
    const estimateTitle = title || generated.title || 'Смета (ИИ)'

    estimateRepository.create(
      id,
      userId,
      pricelistSheetId,
      estimateTitle,
      customerLinkToken,
      masterLinkToken,
      '{}'
    )

    // Create default views
    const customerViewId = uuidv4()
    const masterViewId = uuidv4()
    viewRepository.create(
      customerViewId,
      id,
      'Заказчик',
      customerLinkToken,
      null,
      0
    )
    viewRepository.create(
      masterViewId,
      id,
      'Мастер',
      masterLinkToken,
      null,
      1
    )

    // Create sections and items
    let sectionOrder = 0
    for (const section of generated.sections) {
      const sectionId = uuidv4()
      sectionRepository.create(sectionId, id, section.name, sectionOrder++)

      // View section settings
      viewSectionSettingsRepository.upsert(
        uuidv4(),
        customerViewId,
        sectionId,
        true
      )
      viewSectionSettingsRepository.upsert(
        uuidv4(),
        masterViewId,
        sectionId,
        true
      )

      let itemOrder = 0
      for (const item of section.items) {
        const itemId = uuidv4()
        const customerTotal = item.quantity * item.customerPrice
        const masterTotal = item.quantity * item.masterPrice

        itemRepository.create(
          itemId,
          id,
          sectionId,
          String(itemOrder + 1),
          item.name,
          item.unit,
          item.quantity,
          itemOrder++
        )

        // View item settings
        viewItemSettingsRepository.upsert(
          uuidv4(),
          customerViewId,
          itemId,
          item.customerPrice,
          customerTotal,
          true
        )
        viewItemSettingsRepository.upsert(
          uuidv4(),
          masterViewId,
          itemId,
          item.masterPrice,
          masterTotal,
          true
        )
      }
    }

    return estimateService.buildEstimateResponse(id)
  }
}

export const pdfGenerationService = new PdfGenerationService()

