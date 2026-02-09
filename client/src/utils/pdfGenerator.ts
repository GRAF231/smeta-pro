import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Scan the canvas near `targetY` (±searchRange) and return the Y coordinate
 * of the row that is closest to pure white — i.e. a gap between lines of text.
 */
function findBestSplitY(canvas: HTMLCanvasElement, targetY: number, searchRange: number): number {
  const ctx = canvas.getContext('2d')!
  const w = canvas.width

  const lo = Math.max(0, Math.floor(targetY - searchRange))
  const hi = Math.min(canvas.height - 1, Math.ceil(targetY + searchRange))

  let bestY = Math.round(targetY)
  let bestScore = -1

  for (let y = lo; y <= hi; y++) {
    const row = ctx.getImageData(0, y, w, 1).data
    let whites = 0
    for (let i = 0; i < row.length; i += 4) {
      if (row[i] > 240 && row[i + 1] > 240 && row[i + 2] > 240) whites++
    }
    const score = whites / w
    if (score > bestScore) {
      bestScore = score
      bestY = y
    }
  }
  return bestY
}

/**
 * Render an HTML element to a multi-page A4 PDF and trigger download.
 * Uses html2canvas for rendering and jsPDF for PDF generation.
 * Pages are split at white-space gaps to avoid cutting through text.
 */
export async function renderToPdf(element: HTMLElement, filename: string): Promise<void> {
  const scale = 2
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 794,
  })

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()

  const canvasWidthOriginal = canvas.width / scale
  const mmPerPx = pdfWidth / canvasWidthOriginal
  const pageHeightPx = pdfHeight / mmPerPx * scale

  // Margin we're willing to look up/down from the ideal split for a white gap
  const searchRange = Math.round(pageHeightPx * 0.08) // ~8% of page height

  let yOffset = 0
  let pageNum = 0

  while (yOffset < canvas.height) {
    if (pageNum > 0) pdf.addPage()

    let cropEnd: number
    const idealEnd = yOffset + pageHeightPx

    if (idealEnd >= canvas.height) {
      // Last page — take everything remaining
      cropEnd = canvas.height
    } else {
      // Find the best white-space row near the ideal page boundary
      cropEnd = findBestSplitY(canvas, idealEnd, searchRange)
    }

    const cropHeight = cropEnd - yOffset
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = cropHeight

    const ctx = pageCanvas.getContext('2d')!
    ctx.drawImage(
      canvas,
      0, yOffset, canvas.width, cropHeight,
      0, 0, canvas.width, cropHeight
    )

    const pageImgData = pageCanvas.toDataURL('image/png')
    const pageHeightMm = (cropHeight / scale) * mmPerPx

    pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pageHeightMm)

    yOffset = cropEnd
    pageNum++
  }

  pdf.save(filename)
}

