import { google } from 'googleapis'

/**
 * Сервис для работы с Google Sheets API
 * Предоставляет функции для получения и парсинга данных из Google Таблиц
 */

// Column indices based on the example.xlsx analysis
const COLUMN_MAPPING = {
  number: 0,       // A - № or section name
  name: 1,         // B - Наименование работ
  unit: 2,         // C - Единица измерения
  quantity: 3,     // D - Количество
  customerPrice: 4, // E - Цена (продажная)
  customerTotal: 5, // F - Сумма для заказчика
  masterPrice: 7,  // H - Закупочная цена
  masterTotal: 8,  // I - Сумма для мастеров
}

// Section identifiers (rows that are section headers)
const SECTION_KEYWORDS = [
  'Стены', 'Демонтажные работы', 'ГКЛ', 'Пол', 'Откосы', 'Двери',
  'Вентиляция', 'кондиционирование', 'Монтажные сантехнические',
  'Электрика', 'Натяжной потолок', 'натяжного потолка', 'Дополнительные работы'
]

const SUBTOTAL_KEYWORDS = ['Итого', 'итого']

// Rows to skip (not work items and not sections)
const SKIP_KEYWORDS = [
  'Сроки выполнения', 'Этапы', 'ПЛАН', 'ФАКТ', 'Всего по смете',
  'Итого стоимость', 'Всего  маржи', 'Дополнительные расходы',
  'Расходные материалы', 'Транспортные расходы', 'объеденены по цветам'
]

export interface EstimateItem {
  number: string
  name: string
  unit: string
  quantity: number
  price: number
  total: number
}

export interface Section {
  name: string
  items: EstimateItem[]
  subtotal: number
}

export interface ParsedEstimate {
  title: string
  sections: Section[]
  total: number
}

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !privateKey) {
    throw new Error('Google API credentials not configured')
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  return auth
}

export async function fetchSheetData(sheetId: string): Promise<string[][]> {
  const auth = getAuthClient()
  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A:O', // Fetch columns A to O
  })

  return response.data.values || []
}

function shouldSkipRow(row: string[]): boolean {
  const firstCell = String(row[0] || '').trim().toLowerCase()
  const secondCell = String(row[1] || '').trim().toLowerCase()
  const combined = firstCell + ' ' + secondCell
  
  return SKIP_KEYWORDS.some(kw => combined.includes(kw.toLowerCase()))
}

function isSectionHeader(row: string[]): boolean {
  const firstCell = String(row[0] || '').trim()
  const secondCell = String(row[1] || '').trim()
  
  // Skip rows that should be excluded
  if (shouldSkipRow(row)) {
    return false
  }
  
  // Check if the row is a section header
  for (const keyword of SECTION_KEYWORDS) {
    if (firstCell.toLowerCase().includes(keyword.toLowerCase()) ||
        secondCell.toLowerCase().includes(keyword.toLowerCase())) {
      // Make sure it's not a regular work item (should not have numeric values in price columns)
      const hasNoPrice = !row[COLUMN_MAPPING.customerTotal] || 
                          isNaN(parseFloat(String(row[COLUMN_MAPPING.customerTotal])))
      return hasNoPrice
    }
  }
  return false
}

function isSubtotalRow(row: string[]): boolean {
  const firstCell = String(row[0] || '').trim().toLowerCase()
  // Must be exactly "Итого" and not "Итого стоимость работ" etc.
  return firstCell === 'итого'
}

function isGrandTotalRow(row: string[]): boolean {
  const firstCell = String(row[0] || '').trim().toLowerCase()
  const secondCell = String(row[1] || '').trim().toLowerCase()
  return firstCell.includes('итого стоимость работ') || 
         secondCell.includes('итого стоимость работ')
}

function isWorkItem(row: string[], priceColumn: number): boolean {
  // Skip rows that should be excluded
  if (shouldSkipRow(row)) {
    return false
  }

  const number = String(row[0] || '').trim()
  const name = String(row[COLUMN_MAPPING.name] || '').trim()
  const total = parseFloat(String(row[priceColumn] || '0').replace(/\s/g, ''))

  // Check if it's a numbered item (1, 2, 3, etc.)
  const isNumbered = /^\d+$/.test(number)
  const hasValidTotal = !isNaN(total) && total > 0
  const hasName = name.length > 0 && 
                  !SUBTOTAL_KEYWORDS.some(kw => name.toLowerCase().includes(kw.toLowerCase())) &&
                  !name.toLowerCase().includes('итого')

  return isNumbered && hasValidTotal && hasName
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value
  const str = String(value || '0').replace(/\s/g, '').replace(',', '.')
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

function cleanTitle(title: string): string {
  // Remove excessive underscores and clean up the title
  return title
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseEstimateData(
  rows: string[][],
  type: 'customer' | 'master'
): ParsedEstimate {
  const priceColumn = type === 'customer' ? COLUMN_MAPPING.customerPrice : COLUMN_MAPPING.masterPrice
  const totalColumn = type === 'customer' ? COLUMN_MAPPING.customerTotal : COLUMN_MAPPING.masterTotal

  const sections: Section[] = []
  let currentSection: Section | null = null
  let grandTotal = 0
  let title = 'Смета на ремонтные работы'

  // Try to find the title in the first few rows
  for (let i = 0; i < Math.min(3, rows.length); i++) {
    const cell = String(rows[i]?.[1] || '').trim()
    if (cell.toLowerCase().includes('смета') || cell.toLowerCase().includes('договор')) {
      title = cleanTitle(cell)
      break
    }
  }

  for (const row of rows) {
    // Skip rows that should be excluded
    if (shouldSkipRow(row)) {
      continue
    }

    // Check for grand total BEFORE processing other rows
    if (isGrandTotalRow(row)) {
      grandTotal = parseNumber(row[totalColumn]) || parseNumber(row[5])
      continue
    }

    // Check for section header
    if (isSectionHeader(row)) {
      // Save previous section if exists
      if (currentSection && currentSection.items.length > 0) {
        sections.push(currentSection)
      }
      
      const sectionName = String(row[0] || row[1] || '').trim()
      currentSection = {
        name: sectionName,
        items: [],
        subtotal: 0,
      }
      continue
    }

    // Check for subtotal row
    if (isSubtotalRow(row)) {
      if (currentSection) {
        currentSection.subtotal = parseNumber(row[totalColumn])
        sections.push(currentSection)
        currentSection = null
      }
      continue
    }

    // Check for work item
    if (currentSection && isWorkItem(row, totalColumn)) {
      const item: EstimateItem = {
        number: String(row[COLUMN_MAPPING.number] || '').trim(),
        name: String(row[COLUMN_MAPPING.name] || '').trim(),
        unit: String(row[COLUMN_MAPPING.unit] || '').trim(),
        quantity: parseNumber(row[COLUMN_MAPPING.quantity]),
        price: parseNumber(row[priceColumn]),
        total: parseNumber(row[totalColumn]),
      }
      
      if (item.name && item.total > 0) {
        currentSection.items.push(item)
      }
    }
  }

  // Add last section if not added
  if (currentSection && currentSection.items.length > 0) {
    sections.push(currentSection)
  }

  // If subtotals are zero, calculate them from items
  for (const section of sections) {
    if (section.subtotal === 0) {
      section.subtotal = section.items.reduce((sum, item) => sum + item.total, 0)
    }
  }

  // Calculate grand total if not found
  if (grandTotal === 0) {
    grandTotal = sections.reduce((sum, section) => sum + section.subtotal, 0)
  }

  return {
    title,
    sections: sections.filter(s => s.items.length > 0),
    total: grandTotal,
  }
}

export function extractSheetIdFromUrl(url: string): string {
  // Extract spreadsheet ID from Google Sheets URL
  // Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!match) {
    throw new Error('Неверный формат ссылки на Google Таблицу')
  }
  return match[1]
}

/**
 * Fetch pricelist data from a Google Sheet and return it as formatted text.
 * The sheet can have any structure — AI will parse it.
 * We fetch all data and format it as a readable table for the AI prompt.
 */
export async function fetchPricelistData(sheetId: string): Promise<string> {
  const auth = getAuthClient()
  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A:Z', // Fetch all columns
  })

  const rows = response.data.values || []
  
  if (rows.length === 0) {
    throw new Error('Прайс-лист пуст')
  }

  // Format rows as a readable table text for AI
  const lines = rows.map(row => 
    row.map(cell => String(cell || '').trim()).filter(c => c.length > 0).join(' | ')
  ).filter(line => line.length > 0)

  return lines.join('\n')
}
