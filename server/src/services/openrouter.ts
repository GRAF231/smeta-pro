import https from 'https'
import http from 'http'

/**
 * Сервис для работы с OpenRouter API
 * Предоставляет функции для генерации смет через ИИ и парсинга товаров
 */

export interface GeneratedEstimateItem {
  name: string
  unit: string
  quantity: number
  customerPrice: number
  masterPrice: number
}

export interface GeneratedEstimateSection {
  name: string
  items: GeneratedEstimateItem[]
}

export interface GeneratedEstimate {
  title: string
  sections: GeneratedEstimateSection[]
}

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    throw new Error('OPENROUTER_API_KEY не настроен. Добавьте ключ в .env файл.')
  }
  return key
}

const SYSTEM_PROMPT = `Ты — профессиональный сметчик для ремонтных работ. Твоя задача — на основе дизайн-проекта и прайс-листа составить подробную смету на ремонтные работы.

## Инструкции:
1. Внимательно изучи ВСЕ страницы дизайн-проекта (изображения). Обрати внимание на планировки, чертежи, спецификации, размеры помещений, указанные материалы.
2. Сопоставь необходимые работы с позициями из прайс-листа для определения цен.
3. Оцени объёмы работ (количество) на основе данных из дизайн-проекта (площади стен, полов, потолков и т.д.).
4. Сгруппируй работы по логическим разделам (Демонтаж, Стены, Полы, Потолки, Электрика, Сантехника и т.д.).
5. Для каждой позиции укажи: название работы, единицу измерения, количество и цену.
6. customerPrice — это цена для заказчика (розничная, из прайс-листа).
7. masterPrice — это цена для мастера (себестоимость). Если в прайс-листе нет отдельной себестоимости, используй 70% от customerPrice.

## ВАЖНО: Ответ должен быть СТРОГО в формате JSON без каких-либо дополнительных текстов, комментариев или markdown-разметки. Только валидный JSON.

Формат ответа:
{
  "sections": [
    {
      "name": "Название раздела",
      "items": [
        {
          "name": "Название работы",
          "unit": "м²",
          "quantity": 25.0,
          "customerPrice": 500,
          "masterPrice": 350
        }
      ]
    }
  ]
}`

interface ImageContent {
  type: 'image_url'
  image_url: {
    url: string
  }
}

interface TextContent {
  type: 'text'
  text: string
}

type MessageContent = ImageContent | TextContent

// Max pages to send to AI (Gemini handles many, but we limit for request size)
const MAX_PAGES = 80

function makeOpenRouterRequest(apiKey: string, bodyBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': bodyBuffer.length,
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
        'X-Title': 'Valentin Smeta Generator',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`OpenRouter API error (${res.statusCode}): ${data.substring(0, 500)}`))
          return
        }
        resolve(data)
      })
    })

    req.on('error', (error) => {
      reject(new Error(`OpenRouter request failed: ${error.message}`))
    })

    // 5 minutes timeout for large PDFs
    req.setTimeout(300000, () => {
      req.destroy()
      reject(new Error('OpenRouter request timed out (5 min)'))
    })

    // Write body in chunks to avoid issues with large payloads
    const CHUNK_SIZE = 64 * 1024 // 64KB chunks
    let offset = 0
    function writeChunk() {
      while (offset < bodyBuffer.length) {
        const end = Math.min(offset + CHUNK_SIZE, bodyBuffer.length)
        const chunk = bodyBuffer.subarray(offset, end)
        offset = end
        if (!req.write(chunk)) {
          // Backpressure: wait for drain event
          req.once('drain', writeChunk)
          return
        }
      }
      req.end()
    }
    writeChunk()
  })
}

/**
 * Generate estimate from PDF page screenshots + pricelist using Gemini 2.5 Flash.
 * Gemini has 1M token context — enough for many page images.
 */
export async function generateEstimateFromPDF(
  pageDataUrls: string[],
  pricelistText: string,
  comments: string
): Promise<GeneratedEstimate> {
  const apiKey = getApiKey()

  // Limit pages if too many
  let pages = pageDataUrls
  if (pages.length > MAX_PAGES) {
    console.log(`[AI] Limiting pages from ${pages.length} to ${MAX_PAGES}`)
    pages = pages.slice(0, MAX_PAGES)
  }

  // Build multimodal content: images + text
  const content: MessageContent[] = []

  // Add text intro
  content.push({
    type: 'text',
    text: `Вот страницы дизайн-проекта (${pages.length} стр.):`,
  })

  // Add all page images
  for (let i = 0; i < pages.length; i++) {
    content.push({
      type: 'image_url',
      image_url: {
        url: pages[i],
      },
    })
  }

  // Add pricelist
  content.push({
    type: 'text',
    text: `\n## Прайс-лист (данные из Google Таблицы):\n${pricelistText}`,
  })

  // Add comments if any
  if (comments && comments.trim()) {
    content.push({
      type: 'text',
      text: `\n## Уточняющие комментарии от заказчика:\n${comments}`,
    })
  }

  // Final instruction
  content.push({
    type: 'text',
    text: '\nТеперь составь подробную смету на основе дизайн-проекта и прайс-листа. Ответ — только валидный JSON.',
  })

  const requestBodyStr = JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content,
      },
    ],
    temperature: 0.3,
    max_tokens: 32000,
  })

  const requestBodyBuffer = Buffer.from(requestBodyStr, 'utf-8')
  const sizeMB = (requestBodyBuffer.length / (1024 * 1024)).toFixed(1)
  console.log(`[AI] Sending ${pages.length} pages to Gemini 2.5 Flash (request size: ${sizeMB} MB)...`)

  const responseText = await makeOpenRouterRequest(apiKey, requestBodyBuffer)

  let response: {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
    error?: {
      message?: string
    }
  }

  try {
    response = JSON.parse(responseText)
  } catch {
    throw new Error('Не удалось распарсить ответ от OpenRouter API')
  }

  if (response.error) {
    throw new Error(`OpenRouter API: ${response.error.message || 'Неизвестная ошибка'}`)
  }

  const responseContent = response.choices?.[0]?.message?.content
  if (!responseContent) {
    throw new Error('ИИ не вернул ответ. Попробуйте снова.')
  }

  // Extract JSON from the response (handle potential markdown code blocks)
  let jsonStr = responseContent.trim()
  
  // Remove markdown code block if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  let estimate: GeneratedEstimate
  try {
    const parsed = JSON.parse(jsonStr)
    estimate = {
      title: parsed.title || 'Смета на ремонтные работы',
      sections: parsed.sections || [],
    }
  } catch {
    console.error('[AI] Failed to parse JSON response:', jsonStr.substring(0, 500))
    throw new Error('ИИ вернул некорректный формат данных. Попробуйте снова.')
  }

  // Validate the structure
  if (!estimate.sections || !Array.isArray(estimate.sections) || estimate.sections.length === 0) {
    throw new Error('ИИ не смог составить смету. Попробуйте добавить больше деталей в комментарии.')
  }

  // Validate and clean each section
  estimate.sections = estimate.sections
    .filter(s => s.name && Array.isArray(s.items) && s.items.length > 0)
    .map(section => ({
      name: String(section.name),
      items: section.items
        .filter(item => item.name)
        .map(item => ({
          name: String(item.name),
          unit: String(item.unit || 'шт'),
          quantity: Math.max(0, Number(item.quantity) || 0),
          customerPrice: Math.max(0, Number(item.customerPrice) || 0),
          masterPrice: Math.max(0, Number(item.masterPrice) || 0),
        })),
    }))
    .filter(s => s.items.length > 0)

  if (estimate.sections.length === 0) {
    throw new Error('ИИ не смог составить смету. Попробуйте добавить больше деталей в комментарии.')
  }

  console.log(`[AI] Generated ${estimate.sections.length} sections with ${estimate.sections.reduce((sum, s) => sum + s.items.length, 0)} items`)

  return estimate
}

// ========== PAGE CLASSIFICATION ==========

export interface PageClassification {
  pageNumber: number
  pageType: 'plan' | 'wall_layout' | 'specification' | 'visualization' | 'other'
  roomName: string | null
}

const PAGE_CLASSIFICATION_PROMPT = `Ты — эксперт по анализу дизайн-проектов. Твоя задача — классифицировать страницы PDF дизайн-проекта.

## Типы страниц:
- **plan** — план помещения с размерами (вид сверху)
- **wall_layout** — развертка стен (вид стен с размерами и материалами)
- **specification** — спецификация материалов (таблицы, списки материалов)
- **visualization** — 3D визуализация или рендер
- **other** — прочее (титульный лист, обложка, узлы, детали и т.д.)

## Инструкции:
1. Проанализируй каждую страницу и определи её тип
2. Если страница относится к конкретному помещению (кухня, спальня, ванная и т.д.), укажи название помещения в поле roomName
3. Для титульных страниц, обложек, узлов используй тип "other"
4. Верни JSON массив с классификацией для каждой страницы в том же порядке

## ВАЖНО: Ответ СТРОГО в формате JSON без дополнительных текстов. Только валидный JSON.

Формат ответа:
[
  {
    "pageNumber": 1,
    "pageType": "other",
    "roomName": null
  },
  {
    "pageNumber": 2,
    "pageType": "plan",
    "roomName": "Кухня"
  }
]`

/**
 * Классифицировать страницы PDF через ИИ
 * @param pageThumbnails Массив data URLs миниатюр страниц
 * @returns Массив классификаций
 */
export async function classifyPages(
  pageThumbnails: string[]
): Promise<PageClassification[]> {
  const apiKey = getApiKey()

  if (pageThumbnails.length === 0) {
    return []
  }

  // Build multimodal content: thumbnails + instruction
  const content: MessageContent[] = []

  content.push({
    type: 'text',
    text: `Вот ${pageThumbnails.length} страниц дизайн-проекта. Классифицируй каждую страницу по типу и определи к какому помещению она относится (если применимо).`,
  })

  // Add all thumbnails
  for (let i = 0; i < pageThumbnails.length; i++) {
    content.push({
      type: 'image_url',
      image_url: {
        url: pageThumbnails[i],
      },
    })
    content.push({
      type: 'text',
      text: `Страница ${i + 1}`,
    })
  }

  content.push({
    type: 'text',
    text: '\nВерни JSON массив с классификацией для каждой страницы. Ответ — только валидный JSON.',
  })

  const requestBodyStr = JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: PAGE_CLASSIFICATION_PROMPT,
      },
      {
        role: 'user',
        content,
      },
    ],
    temperature: 0.1, // Low temperature for consistent classification
    max_tokens: 8000,
  })

  const requestBodyBuffer = Buffer.from(requestBodyStr, 'utf-8')
  const sizeMB = (requestBodyBuffer.length / (1024 * 1024)).toFixed(1)
  console.log(
    `[AI] Sending ${pageThumbnails.length} page thumbnails for classification (request size: ${sizeMB} MB)...`
  )

  const responseText = await makeOpenRouterRequest(apiKey, requestBodyBuffer)

  let response: {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
    error?: {
      message?: string
    }
  }

  try {
    response = JSON.parse(responseText)
  } catch {
    throw new Error('Не удалось распарсить ответ от OpenRouter API')
  }

  if (response.error) {
    throw new Error(`OpenRouter API: ${response.error.message || 'Неизвестная ошибка'}`)
  }

  const responseContent = response.choices?.[0]?.message?.content
  if (!responseContent) {
    throw new Error('ИИ не вернул ответ. Попробуйте снова.')
  }

  // Extract JSON from the response
  let jsonStr = responseContent.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  let classifications: PageClassification[]
  try {
    const parsed = JSON.parse(jsonStr)
    // Handle both array and object with array property
    const array = Array.isArray(parsed) ? parsed : parsed.classifications || parsed.pages || []
    
    classifications = array.map((item: any, index: number) => ({
      pageNumber: Number(item.pageNumber) || index + 1,
      pageType: (item.pageType || 'other') as PageClassification['pageType'],
      roomName: item.roomName || null,
    }))
  } catch (err) {
    console.error('[AI] Failed to parse classification JSON:', jsonStr.substring(0, 500))
    throw new Error('ИИ вернул некорректный формат данных. Попробуйте снова.')
  }

  // Ensure we have classifications for all pages
  while (classifications.length < pageThumbnails.length) {
    classifications.push({
      pageNumber: classifications.length + 1,
      pageType: 'other',
      roomName: null,
    })
  }

  console.log(
    `[AI] Classified ${classifications.length} pages: ${classifications.filter(c => c.pageType !== 'other').length} non-other pages`
  )

  return classifications
}

// ========== PROJECT STRUCTURE ANALYSIS ==========

export interface ProjectRoom {
  name: string
  type: string | null
  area: number | null // Площадь из таблицы (м²)
  planType: 'original' | 'renovated' | 'both' // Из какого плана взята информация
  source: string // Название плана (например, "Обмерный план" или "План расстановки мебели")
}

export interface ProjectStructure {
  totalArea: number | null // Общая площадь из таблицы
  address: string | null
  roomCount: number
  rooms: ProjectRoom[]
  planTypes: string[] // Типы найденных планов (например, ["Обмерный план", "План расстановки мебели"])
}

const STRUCTURE_ANALYSIS_PROMPT = `Ты — эксперт по анализу архитектурных планов. Твоя задача — точно извлечь информацию о структуре проекта из планов.

## КРИТИЧЕСКИ ВАЖНО:
1. **НЕ ВЫДУМЫВАЙ ЧИСЛА!** Используй ТОЛЬКО те площади, которые написаны в таблицах на планах. Если площадь не указана в таблице — ставь null.
2. Если в проекте есть несколько планов (например, "Обмерный план М1:50" и "План расстановки мебели М1:50"), они могут содержать РАЗНЫЕ помещения и площади. Сохрани информацию из ОБОИХ планов.
3. Внимательно найди таблицы с площадями помещений на каждом плане (обычно внизу или сбоку плана, с заголовками типа "Площадь м²" или "Площадь, м²"). Извлеки точные значения из этих таблиц.
4. Если помещение есть только в одном плане — укажи planType: "original" (для обмерного плана) или "renovated" (для плана после перепланировки).
5. Если помещение есть в обоих планах — создай ОДНУ запись с planType: "both" и используй площадь из того плана, где она указана, или из обоих если они отличаются (в этом случае можно создать две записи с разными source).
6. Название помещения бери ТОЧНО из таблицы, как оно написано.
7. Если в таблице указана общая площадь (обычно внизу таблицы, строка "Общая площадь" или "Итого") — извлеки её в поле totalArea.

## Инструкции:
1. Найди титульные страницы и извлеки общую информацию (адрес, общая площадь, количество комнат).
2. Найди планы помещений (обмерные планы, планы расстановки мебели и т.д.).
3. Для каждого плана найди таблицу с площадями помещений (обычно внизу или сбоку плана).
4. Извлеки из таблиц:
   - Название каждого помещения (точно как написано)
   - Площадь помещения в м² (ТОЧНО как указано в таблице)
   - Тип помещения (кухня, спальня, ванная, коридор и т.д.)
5. Определи тип плана (например, "Обмерный план М1:50", "План расстановки мебели М1:50").
6. Если на плане указана общая площадь — извлеки её тоже.

## ВАЖНО: Ответ СТРОГО в формате JSON без дополнительных текстов. Только валидный JSON.

Формат ответа:
{
  "totalArea": 36.83,
  "address": "Адрес проекта (если указан)",
  "roomCount": 4,
  "planTypes": ["Обмерный план М1:50", "План расстановки мебели М1:50"],
  "rooms": [
    {
      "name": "Прихожая - коридор",
      "type": "corridor",
      "area": 4.20,
      "planType": "original",
      "source": "Обмерный план М1:50"
    },
    {
      "name": "Кухня",
      "type": "kitchen",
      "area": 12.31,
      "planType": "original",
      "source": "Обмерный план М1:50"
    },
    {
      "name": "Кухня-столовая",
      "type": "kitchen",
      "area": 14.32,
      "planType": "renovated",
      "source": "План расстановки мебели М1:50"
    }
  ]
}

Если помещение есть в обоих планах с одинаковой площадью, можно указать planType: "both".`

const TABLE_DETECTION_PROMPT = `Ты — эксперт по анализу архитектурных планов. Твоя задача — найти таблицы с площадями помещений на планах.

## КРИТИЧЕСКИ ВАЖНО:
1. **Включи ВСЮ таблицу целиком** - все колонки (включая колонку с площадями), все строки (включая заголовки и итоговую строку).
2. Координаты должны включать ВСЮ таблицу от левого края первой колонки до правого края последней колонки.
3. **Высота (height) должна включать заголовок таблицы сверху И ВСЮ итоговую строку снизу** (включая "Общая площадь" или "Итого").
4. **Координата y должна быть на уровне начала заголовка таблицы**, а height должна доходить ДО КОНЦА итоговой строки включительно.
5. Если видишь строку "Общая площадь" или "Итого" внизу таблицы - она ДОЛЖНА быть включена в height.

## Инструкции:
1. Найди все таблицы с площадями помещений на каждом плане (обычно внизу или сбоку плана).
2. Для каждой таблицы определи её расположение: верхний левый угол (x, y) и размеры (width, height) в пикселях.
3. **Убедись, что width включает ВСЕ колонки таблицы** (№, Наименование помещения, Площадь м² и т.д.).
4. **Убедись, что height включает заголовок и все строки** до последней строки с итогами.
5. Также определи тип плана (например, "Обмерный план М1:50" или "План расстановки мебели М1:50").
6. Если таблица не найдена, верни пустой массив для этого плана.

## ВАЖНО: Ответ СТРОГО в формате JSON без дополнительных текстов. Только валидный JSON.

Формат ответа:
[
  {
    "planIndex": 0,
    "planType": "Обмерный план М1:50",
    "tables": [
      {
        "x": 100,
        "y": 2000,
        "width": 1200,
        "height": 600,
        "description": "Таблица с площадями помещений внизу плана, включает все колонки"
      }
    ]
  },
  {
    "planIndex": 1,
    "planType": "План расстановки мебели М1:50",
    "tables": [
      {
        "x": 50,
        "y": 1900,
        "width": 1300,
        "height": 700,
        "description": "Таблица с площадями помещений внизу плана, включает все колонки"
      }
    ]
  }
]`

export interface TableLocation {
  x: number
  y: number
  width: number
  height: number
  description: string
}

export interface PlanTableInfo {
  planIndex: number
  planType: string
  tables: TableLocation[]
}

const STRUCTURE_FROM_TABLES_PROMPT = `Ты — эксперт по анализу таблиц с площадями помещений. Твоя задача — точно извлечь информацию из таблиц.

## КРИТИЧЕСКИ ВАЖНО:
1. **НЕ ВЫДУМЫВАЙ ЧИСЛА!** Используй ТОЛЬКО те площади, которые написаны в таблицах. Если площадь не указана — ставь null.
2. Название помещения бери ТОЧНО из таблицы, как оно написано (включая все знаки препинания, дефисы и т.д.).
3. Площадь бери ТОЧНО как указано в таблице (число в м²). Не округляй и не изменяй значения.
4. Если в таблице указана общая площадь (обычно внизу таблицы, строка "Общая площадь" или "Итого") — извлеки её в поле totalArea.

## Инструкции:
1. Для каждой таблицы извлеки все строки с помещениями.
2. Для каждой строки извлеки: название помещения (ТОЧНО как написано), площадь в м² (ТОЧНО как указано).
3. Определи тип помещения (кухня, спальня, ванная, коридор и т.д.) по названию.
4. Определи тип плана из контекста:
   - "original" для обмерного плана (обычно содержит слова "Обмерный", "Существующий")
   - "renovated" для плана после перепланировки (обычно содержит слова "Расстановка мебели", "После перепланировки", "Проект")

## ВАЖНО: Ответ СТРОГО в формате JSON без дополнительных текстов. Только валидный JSON.

Если у тебя несколько таблиц, верни массив результатов для каждой таблицы. Если одна таблица — верни один объект.

Формат ответа для одной таблицы:
{
  "totalArea": 36.83,
  "planType": "Обмерный план М1:50",
  "planTypeCode": "original",
  "rooms": [
    {
      "name": "Прихожая - коридор",
      "type": "corridor",
      "area": 4.20
    },
    {
      "name": "Кухня",
      "type": "kitchen",
      "area": 12.31
    }
  ]
}

Формат ответа для нескольких таблиц:
[
  {
    "totalArea": 36.83,
    "planType": "Обмерный план М1:50",
    "planTypeCode": "original",
    "rooms": [...]
  },
  {
    "totalArea": 57.35,
    "planType": "План расстановки мебели М1:50",
    "planTypeCode": "renovated",
    "rooms": [...]
  }
]`

/**
 * Обнаружить таблицы на планах через ИИ
 * @param planPages Массив data URLs планов помещений
 * @returns Информация о расположении таблиц на каждом плане
 */
export async function detectTablesOnPlans(
  planPages: string[]
): Promise<PlanTableInfo[]> {
  const apiKey = getApiKey()

  if (planPages.length === 0) {
    return []
  }

  const content: MessageContent[] = []

  content.push({
    type: 'text',
    text: `Найди таблицы с площадями помещений на ${planPages.length} планах. Для каждого плана определи расположение таблиц (координаты x, y, width, height в пикселях) и тип плана.`,
  })

  for (let i = 0; i < planPages.length; i++) {
    content.push({
      type: 'image_url',
      image_url: {
        url: planPages[i],
      },
    })
    content.push({
      type: 'text',
      text: `План ${i + 1}`,
    })
  }

  content.push({
    type: 'text',
    text: '\nВерни JSON массив с информацией о таблицах для каждого плана.',
  })

  const requestBodyStr = JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: TABLE_DETECTION_PROMPT,
      },
      {
        role: 'user',
        content,
      },
    ],
    temperature: 0.1,
    max_tokens: 4000,
  })

  const requestBodyBuffer = Buffer.from(requestBodyStr, 'utf-8')
  console.log(`[AI] Detecting tables on ${planPages.length} plans...`)

  const responseText = await makeOpenRouterRequest(apiKey, requestBodyBuffer)

  let response: {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
    error?: {
      message?: string
    }
  }

  try {
    response = JSON.parse(responseText)
  } catch {
    throw new Error('Не удалось распарсить ответ от OpenRouter API')
  }

  if (response.error) {
    throw new Error(`OpenRouter API: ${response.error.message || 'Неизвестная ошибка'}`)
  }

  const responseContent = response.choices?.[0]?.message?.content
  if (!responseContent) {
    throw new Error('ИИ не вернул ответ. Попробуйте снова.')
  }

  let jsonStr = responseContent.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  let tableInfos: PlanTableInfo[]
  try {
    const parsed = JSON.parse(jsonStr)
    tableInfos = Array.isArray(parsed) ? parsed : []
    
    // Validate and normalize
    tableInfos = tableInfos.map((info: any) => ({
      planIndex: Number(info.planIndex) || 0,
      planType: String(info.planType || ''),
      tables: Array.isArray(info.tables)
        ? info.tables.map((table: any) => ({
            x: Number(table.x) || 0,
            y: Number(table.y) || 0,
            width: Number(table.width) || 0,
            height: Number(table.height) || 0,
            description: String(table.description || ''),
          }))
        : [],
    }))
  } catch (err) {
    console.error('[AI] Failed to parse table detection JSON:', jsonStr.substring(0, 500))
    throw new Error('ИИ вернул некорректный формат данных при обнаружении таблиц.')
  }

  console.log(`[AI] Detected tables on ${tableInfos.length} plans`)
  return tableInfos
}

/**
 * Анализировать структуру проекта через ИИ, используя только таблицы
 * @param titlePages Массив data URLs титульных страниц
 * @param tableImages Массив data URLs изображений таблиц с площадями
 * @param planTypes Массив типов планов для каждой таблицы
 * @returns Структура проекта с помещениями и площадями
 */
export async function analyzeProjectStructureFromTables(
  titlePages: string[],
  tableImages: string[],
  planTypes: string[]
): Promise<ProjectStructure> {
  const apiKey = getApiKey()

  if (tableImages.length === 0) {
    throw new Error('Необходимо предоставить хотя бы одну таблицу')
  }

  const content: MessageContent[] = []

  content.push({
    type: 'text',
    text: `Проанализируй структуру проекта из таблиц с площадями помещений. В проекте ${titlePages.length} титульных страниц и ${tableImages.length} таблиц с площадями.`,
  })

  // Add title pages first
  if (titlePages.length > 0) {
    content.push({
      type: 'text',
      text: '\n=== ТИТУЛЬНЫЕ СТРАНИЦЫ ===',
    })
    for (let i = 0; i < titlePages.length; i++) {
      content.push({
        type: 'image_url',
        image_url: {
          url: titlePages[i],
        },
      })
      content.push({
        type: 'text',
        text: `Титульная страница ${i + 1}`,
      })
    }
  }

  // Add table images
  content.push({
    type: 'text',
    text: '\n=== ТАБЛИЦЫ С ПЛОЩАДЯМИ ПОМЕЩЕНИЙ ===\nВнимательно извлеки точные значения из каждой таблицы.',
  })
  for (let i = 0; i < tableImages.length; i++) {
    content.push({
      type: 'image_url',
      image_url: {
        url: tableImages[i],
      },
    })
    content.push({
      type: 'text',
      text: `Таблица ${i + 1} (${planTypes[i] || 'Неизвестный план'})`,
    })
  }

  content.push({
    type: 'text',
    text: '\nВерни JSON с извлеченной структурой проекта. Помни: используй ТОЛЬКО площади из таблиц, не выдумывай числа!',
  })

  const requestBodyStr = JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: STRUCTURE_FROM_TABLES_PROMPT,
      },
      {
        role: 'user',
        content,
      },
    ],
    temperature: 0.1,
    max_tokens: 8000,
  })

  const requestBodyBuffer = Buffer.from(requestBodyStr, 'utf-8')
  const sizeMB = (requestBodyBuffer.length / (1024 * 1024)).toFixed(1)
  console.log(
    `[AI] Analyzing structure from ${tableImages.length} tables (request size: ${sizeMB} MB)...`
  )

  const responseText = await makeOpenRouterRequest(apiKey, requestBodyBuffer)

  let response: {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
    error?: {
      message?: string
    }
  }

  try {
    response = JSON.parse(responseText)
  } catch {
    throw new Error('Не удалось распарсить ответ от OpenRouter API')
  }

  if (response.error) {
    throw new Error(`OpenRouter API: ${response.error.message || 'Неизвестная ошибка'}`)
  }

  const responseContent = response.choices?.[0]?.message?.content
  if (!responseContent) {
    throw new Error('ИИ не вернул ответ. Попробуйте снова.')
  }

  let jsonStr = responseContent.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  // Parse multiple table results and combine them
  let allRooms: ProjectRoom[] = []
  let allPlanTypes: string[] = []
  let totalArea: number | null = null
  let address: string | null = null

  try {
    // Try to parse as single object first
    const parsed = JSON.parse(jsonStr)
    
    if (Array.isArray(parsed)) {
      // Multiple table results
      for (const tableResult of parsed) {
        if (tableResult.rooms) {
          allRooms.push(...tableResult.rooms.map((room: any) => ({
            name: String(room.name || ''),
            type: room.type || null,
            area: room.area ? Number(room.area) : null,
            planType: (tableResult.planTypeCode || 'original') as 'original' | 'renovated' | 'both',
            source: String(tableResult.planType || ''),
          })))
        }
        if (tableResult.planType && !allPlanTypes.includes(tableResult.planType)) {
          allPlanTypes.push(tableResult.planType)
        }
        if (tableResult.totalArea && !totalArea) {
          totalArea = Number(tableResult.totalArea)
        }
      }
    } else {
      // Single table result
      allRooms = (parsed.rooms || []).map((room: any) => ({
        name: String(room.name || ''),
        type: room.type || null,
        area: room.area ? Number(room.area) : null,
        planType: (parsed.planTypeCode || 'original') as 'original' | 'renovated' | 'both',
        source: String(parsed.planType || ''),
      }))
      if (parsed.planType) {
        allPlanTypes.push(parsed.planType)
      }
      if (parsed.totalArea) {
        totalArea = Number(parsed.totalArea)
      }
      if (parsed.address) {
        address = String(parsed.address)
      }
    }
  } catch (err) {
    console.error('[AI] Failed to parse structure JSON:', jsonStr.substring(0, 500))
    throw new Error('ИИ вернул некорректный формат данных. Попробуйте снова.')
  }

  // Deduplicate rooms: remove duplicates within same plan type (same name + same planType = duplicate)
  // Normalize room names for comparison (trim, lowercase, normalize spaces)
  const normalizeRoomName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .replace(/[–—]/g, '-') // Normalize different dash types
  }

  // Group rooms by normalized name and plan type to detect duplicates
  const deduplicatedRooms: ProjectRoom[] = []
  const seenKeys = new Set<string>()

  for (const room of allRooms) {
    const normalizedName = normalizeRoomName(room.name)
    // Use only name and planType for deduplication key (ignore source to catch duplicates from same plan type)
    const dedupKey = `${normalizedName}|${room.planType}`
    
    if (seenKeys.has(dedupKey)) {
      console.log(
        `[AI] Deduplicating room "${room.name}" (${room.planType}): skipping duplicate`
      )
      continue
    }

    // Check for duplicates within same plan type (same name + same planType = duplicate)
    const duplicateInSamePlan = deduplicatedRooms.find(
      (r) =>
        normalizeRoomName(r.name) === normalizedName &&
        r.planType === room.planType
    )

    if (duplicateInSamePlan) {
      // Prefer room with area, or keep existing if both have areas
      if (room.area !== null && duplicateInSamePlan.area === null) {
        const index = deduplicatedRooms.indexOf(duplicateInSamePlan)
        deduplicatedRooms[index] = room
        console.log(
          `[AI] Replacing room "${room.name}" (${room.planType}) with version that has area`
        )
      } else {
        console.log(
          `[AI] Deduplicating room "${room.name}" (${room.planType}): skipping duplicate (already exists)`
        )
      }
    } else {
      seenKeys.add(dedupKey)
      deduplicatedRooms.push(room)
    }
  }

  console.log(
    `[AI] Deduplicated rooms: ${allRooms.length} -> ${deduplicatedRooms.length} (removed ${allRooms.length - deduplicatedRooms.length} duplicates)`
  )

  const structure: ProjectStructure = {
    totalArea,
    address,
    roomCount: deduplicatedRooms.length,
    rooms: deduplicatedRooms,
    planTypes: allPlanTypes,
  }

  if (structure.rooms.length === 0) {
    throw new Error('ИИ не смог извлечь информацию о помещениях из таблиц. Проверьте качество изображений таблиц.')
  }

  console.log(
    `[AI] Extracted structure: ${structure.rooms.length} rooms, total area: ${structure.totalArea || 'N/A'} m²`
  )

  return structure
}

/**
 * Анализировать структуру проекта через ИИ (старый метод для обратной совместимости)
 * @param titlePages Массив data URLs титульных страниц
 * @param planPages Массив data URLs планов помещений
 * @returns Структура проекта с помещениями и площадями
 */
export async function analyzeProjectStructure(
  titlePages: string[],
  planPages: string[]
): Promise<ProjectStructure> {
  const apiKey = getApiKey()

  if (planPages.length === 0) {
    throw new Error('Необходимо предоставить хотя бы один план')
  }

  // Build multimodal content
  const content: MessageContent[] = []

  content.push({
    type: 'text',
    text: `Проанализируй структуру проекта. В проекте ${titlePages.length} титульных страниц и ${planPages.length} планов помещений.`,
  })

  // Add title pages first
  if (titlePages.length > 0) {
    content.push({
      type: 'text',
      text: '\n=== ТИТУЛЬНЫЕ СТРАНИЦЫ ===',
    })
    for (let i = 0; i < titlePages.length; i++) {
      content.push({
        type: 'image_url',
        image_url: {
          url: titlePages[i],
        },
      })
      content.push({
        type: 'text',
        text: `Титульная страница ${i + 1}`,
      })
    }
  }

  // Add plan pages
  content.push({
    type: 'text',
    text: '\n=== ПЛАНЫ ПОМЕЩЕНИЙ ===\nВнимательно найди таблицы с площадями на каждом плане и извлеки точные значения.',
  })
  for (let i = 0; i < planPages.length; i++) {
    content.push({
      type: 'image_url',
      image_url: {
        url: planPages[i],
      },
    })
    content.push({
      type: 'text',
      text: `План ${i + 1}`,
    })
  }

  content.push({
    type: 'text',
    text: '\nВерни JSON с извлеченной структурой проекта. Помни: используй ТОЛЬКО площади из таблиц, не выдумывай числа!',
  })

  const requestBodyStr = JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: STRUCTURE_ANALYSIS_PROMPT,
      },
      {
        role: 'user',
        content,
      },
    ],
    temperature: 0.1, // Low temperature for accurate extraction
    max_tokens: 8000,
  })

  const requestBodyBuffer = Buffer.from(requestBodyStr, 'utf-8')
  const sizeMB = (requestBodyBuffer.length / (1024 * 1024)).toFixed(1)
  console.log(
    `[AI] Analyzing project structure: ${titlePages.length} title pages, ${planPages.length} plan pages (request size: ${sizeMB} MB)...`
  )

  const responseText = await makeOpenRouterRequest(apiKey, requestBodyBuffer)

  let response: {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
    error?: {
      message?: string
    }
  }

  try {
    response = JSON.parse(responseText)
  } catch {
    throw new Error('Не удалось распарсить ответ от OpenRouter API')
  }

  if (response.error) {
    throw new Error(`OpenRouter API: ${response.error.message || 'Неизвестная ошибка'}`)
  }

  const responseContent = response.choices?.[0]?.message?.content
  if (!responseContent) {
    throw new Error('ИИ не вернул ответ. Попробуйте снова.')
  }

  // Extract JSON from the response
  let jsonStr = responseContent.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  let structure: ProjectStructure
  try {
    const parsed = JSON.parse(jsonStr)
    
    structure = {
      totalArea: parsed.totalArea ? Number(parsed.totalArea) : null,
      address: parsed.address || null,
      roomCount: parsed.roomCount ? Number(parsed.roomCount) : 0,
      planTypes: Array.isArray(parsed.planTypes) ? parsed.planTypes : [],
      rooms: Array.isArray(parsed.rooms)
        ? parsed.rooms.map((room: any) => ({
            name: String(room.name || ''),
            type: room.type || null,
            area: room.area ? Number(room.area) : null,
            planType: (room.planType || 'original') as 'original' | 'renovated' | 'both',
            source: String(room.source || ''),
          }))
        : [],
    }
  } catch (err) {
    console.error('[AI] Failed to parse structure JSON:', jsonStr.substring(0, 500))
    throw new Error('ИИ вернул некорректный формат данных. Попробуйте снова.')
  }

  // Validate structure
  if (!structure.rooms || structure.rooms.length === 0) {
    throw new Error('ИИ не смог извлечь информацию о помещениях. Проверьте качество изображений планов.')
  }

  console.log(
    `[AI] Extracted structure: ${structure.rooms.length} rooms, total area: ${structure.totalArea || 'N/A'} m²`
  )

  return structure
}

// ========== PRODUCT PARSING FROM URLs ==========

export interface ParsedProduct {
  name: string
  article: string
  brand: string
  unit: string
  price: number
  description: string
}

const PRODUCT_PARSE_PROMPT = `Ты — парсер товаров из интернет-магазинов. Твоя задача — извлечь информацию о товаре из HTML-контента веб-страницы.

## Инструкции:
1. Найди основную информацию о товаре на странице.
2. Извлеки: название, артикул, бренд/производитель, цену, единицу измерения и описание/характеристики.
3. Цену бери ЧИСЛОМ без валюты и пробелов. Если указано несколько цен — бери розничную (не оптовую, не со скидкой).
4. Единицу измерения определи из контекста (шт, м.кв, м.п, упаковка, коробка и т.д.). Если не указано — ставь "шт".
5. В описание включи основные характеристики товара (размеры, материал, цвет, страна производства и т.д.), кратко.

## ВАЖНО: Ответ СТРОГО в формате JSON без дополнительных текстов. Только валидный JSON.

Формат ответа:
{
  "name": "Полное название товара с артикулом",
  "article": "Артикул",
  "brand": "Бренд / Производитель",
  "unit": "шт",
  "price": 12345.00,
  "description": "Основные характеристики: размер, материал, цвет и т.д."
}`

/**
 * Fetch HTML content from a URL using native http/https modules.
 */
function fetchPageHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const transport = parsedUrl.protocol === 'https:' ? https : http

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    }

    const req = transport.request(options, (res) => {
      // Follow redirects (up to 5)
      if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString()
        fetchPageHtml(redirectUrl).then(resolve).catch(reject)
        return
      }

      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} при загрузке ${url}`))
        return
      }

      let data = ''
      res.setEncoding('utf-8')
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => resolve(data))
    })

    req.on('error', (err) => reject(new Error(`Ошибка загрузки ${url}: ${err.message}`)))
    req.setTimeout(30000, () => {
      req.destroy()
      reject(new Error(`Таймаут загрузки ${url}`))
    })
    req.end()
  })
}

/**
 * Strip HTML to meaningful text content — remove scripts, styles, etc.
 * Keep only text within body, limit to ~50K chars for AI context.
 */
function cleanHtml(html: string): string {
  // Remove scripts, styles, comments, SVG, noscript
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // Extract body if present
  const bodyMatch = text.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i)
  if (bodyMatch) {
    text = bodyMatch[1]
  }

  // Remove HTML tags but keep text
  text = text.replace(/<[^>]+>/g, ' ')

  // Clean whitespace
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Limit to ~50K chars
  if (text.length > 50000) {
    text = text.substring(0, 50000)
  }

  return text
}

/**
 * Parse a single product page using AI.
 */
async function parseOneProduct(apiKey: string, url: string, htmlText: string): Promise<ParsedProduct> {
  const requestBodyStr = JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: PRODUCT_PARSE_PROMPT,
      },
      {
        role: 'user',
        content: `URL страницы: ${url}\n\nТекстовое содержимое страницы:\n${htmlText}\n\nИзвлеки данные о товаре. Ответ — только валидный JSON.`,
      },
    ],
    temperature: 0.1,
    max_tokens: 4000,
  })

  const requestBodyBuffer = Buffer.from(requestBodyStr, 'utf-8')
  const responseText = await makeOpenRouterRequest(apiKey, requestBodyBuffer)

  let response: {
    choices?: Array<{ message?: { content?: string } }>
    error?: { message?: string }
  }

  try {
    response = JSON.parse(responseText)
  } catch {
    throw new Error('Не удалось распарсить ответ от OpenRouter API')
  }

  if (response.error) {
    throw new Error(`OpenRouter API: ${response.error.message || 'Неизвестная ошибка'}`)
  }

  const responseContent = response.choices?.[0]?.message?.content
  if (!responseContent) {
    throw new Error('ИИ не вернул ответ')
  }

  let jsonStr = responseContent.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  let parsed: ParsedProduct
  try {
    const raw = JSON.parse(jsonStr)
    parsed = {
      name: String(raw.name || 'Товар'),
      article: String(raw.article || ''),
      brand: String(raw.brand || ''),
      unit: String(raw.unit || 'шт'),
      price: Math.max(0, Number(raw.price) || 0),
      description: String(raw.description || ''),
    }
  } catch {
    console.error('[AI] Failed to parse product JSON:', jsonStr.substring(0, 300))
    throw new Error(`Не удалось извлечь данные товара из ${url}`)
  }

  return parsed
}

/**
 * Parse multiple product URLs using AI.
 * Returns an array of parsed products (one per URL).
 */
export async function parseProductsFromUrls(urls: string[]): Promise<(ParsedProduct & { url: string })[]> {
  const apiKey = getApiKey()
  const results: (ParsedProduct & { url: string })[] = []

  for (const url of urls) {
    try {
      console.log(`[Parser] Fetching ${url}...`)
      const html = await fetchPageHtml(url)
      const cleanedText = cleanHtml(html)

      if (cleanedText.length < 50) {
        console.warn(`[Parser] Page ${url} has too little content, skipping`)
        results.push({
          name: `Не удалось загрузить: ${url}`,
          article: '',
          brand: '',
          unit: 'шт',
          price: 0,
          description: 'Страница не содержит достаточно данных',
          url,
        })
        continue
      }

      console.log(`[Parser] Sending to AI (${cleanedText.length} chars)...`)
      const product = await parseOneProduct(apiKey, url, cleanedText)
      results.push({ ...product, url })
      console.log(`[Parser] Parsed: ${product.name} — ${product.price} руб.`)
    } catch (err) {
      console.error(`[Parser] Error parsing ${url}:`, err)
      results.push({
        name: `Ошибка парсинга: ${url}`,
        article: '',
        brand: '',
        unit: 'шт',
        price: 0,
        description: `Ошибка: ${(err as Error).message}`,
        url,
      })
    }
  }

  return results
}

// ========== ROOM DATA EXTRACTION ==========

export interface ImportantRegion {
  x: number
  y: number
  width: number
  height: number
  type: 'table' | 'specification' | 'dimensions' | 'legend' | 'notes'
  description: string
}

export interface RoomExtractionResult {
  wallMaterials: Array<{
    material: string
    description: string
    area?: number
  }>
  floorMaterial: {
    material: string
    description: string
    area?: number
  } | null
  ceilingMaterial: {
    material: string
    description: string
    area?: number
  } | null
  electrical: {
    outlets: number
    switches: number
    fixtures: number
    locations?: Array<{
      type: 'outlet' | 'switch' | 'fixture'
      description: string
    }>
  }
  openings: Array<{
    type: 'door' | 'window' | 'arch'
    width?: number
    height?: number
    description: string
  }>
  dimensions: {
    length?: number
    width?: number
    height?: number
    area?: number
  }
  notes?: string[]
}

export interface MaterialBillItem {
  position: number // Позиция в таблице
  name: string // Наименование материала
  unit: string // Единица измерения (м², м.п., шт и т.д.)
  quantity: number | null // Количество
  article?: string // Артикул
  brand?: string // Марка/Бренд
  manufacturer?: string // Производитель
  description?: string // Описание/Примечания
}

export interface MaterialBill {
  title: string // Название таблицы (например, "Ведомость материалов")
  roomName?: string // К какому помещению относится
  items: MaterialBillItem[]
}

const IMPORTANT_REGIONS_DETECTION_PROMPT = `Ты — эксперт по анализу архитектурных чертежей и разверток помещений. Твоя задача — найти важные области с точными числами, таблицами и спецификациями.

## КРИТИЧЕСКИ ВАЖНО - ПРИОРИТЕТ #1: ТАБЛИЦЫ С ВЕДОМОСТЯМИ МАТЕРИАЛОВ!
1. **В ПЕРВУЮ ОЧЕРЕДЬ найди таблицы с ведомостями материалов** — это самые важные таблицы в дизайн-проекте! Они обычно содержат:
   - Названия материалов отделки (стены, пол, потолок)
   - Количество/площади материалов
   - Артикулы, марки, производителей
   - Единицы измерения
   - Могут называться: "Ведомость материалов", "Спецификация материалов", "Ведомость отделочных материалов", "Таблица материалов"
2. **Включи ВСЮ таблицу целиком**: все колонки (№, Наименование, Ед. изм., Количество, Артикул, Марка, Производитель и т.д.), все строки, включая заголовки и итоги.
3. **Координаты должны быть точными**: x, y — верхний левый угол области, width и height — полные размеры области.
4. **Типы областей** (в порядке приоритета):
   - "table" — **ПРИОРИТЕТ #1**: таблицы с ведомостями материалов, спецификациями материалов, площадями, размерами
   - "specification" — текстовые спецификации материалов с точными данными
   - "dimensions" — области с размерами проемов, помещений (окна, двери, арки)
   - "legend" — легенды с обозначениями материалов, элементов
   - "notes" — примечания с техническими данными

## Инструкции:
1. Проанализируй каждое изображение помещения (развертку, план).
2. **В ПЕРВУЮ ОЧЕРЕДЬ найди таблицы с ведомостями материалов** — они критически важны!
3. Затем найди все остальные области с точными данными: спецификации, размеры, легенды, примечания.
4. Для каждой области определи её расположение (x, y, width, height в пикселях) и тип.
5. Убедись, что координаты включают ВСЮ область целиком.

## ВАЖНО: Ответ СТРОГО в формате JSON без дополнительных текстов. Только валидный JSON.

Формат ответа:
[
  {
    "pageIndex": 0,
    "regions": [
      {
        "x": 100,
        "y": 200,
        "width": 800,
        "height": 400,
        "type": "table",
        "description": "Таблица со спецификацией материалов отделки стен"
      },
      {
        "x": 50,
        "y": 1500,
        "width": 600,
        "height": 300,
        "type": "dimensions",
        "description": "Размеры проемов (двери, окна)"
      }
    ]
  }
]`

const ROOM_DATA_EXTRACTION_PROMPT = `Ты — эксперт по анализу дизайн-проектов помещений. Твоя задача — извлечь детальную информацию о материалах отделки, коммуникациях и размерах помещения.

## КРИТИЧЕСКИ ВАЖНО:
1. **Используй ТОЛЬКО данные из изображений** — не выдумывай информацию.
2. **Извлекай точные числа** из таблиц, спецификаций и размеров.
3. **Если информация не указана** — ставь null или пустой массив.

## Инструкции:
1. **Материалы отделки стен**: найди в спецификациях и таблицах материалы для стен (обои, краска, плитка, панели и т.д.). Укажи материал и описание. Если указана площадь — извлеки её.
2. **Напольное покрытие**: найди тип напольного покрытия (ламинат, паркет, плитка, линолеум и т.д.). Если указана площадь — извлеки её.
3. **Потолок**: найди тип потолка (натяжной, подвесной, покраска и т.д.). Если указана площадь — извлеки её.
4. **Электрика**: подсчитай количество розеток, выключателей, светильников. Если указаны их расположения — опиши.
5. **Проемы**: найди все проемы (двери, окна, арки). Извлеки их размеры (ширина, высота) если указаны.
6. **Размеры помещения**: извлеки длину, ширину, высоту, площадь если указаны в таблицах или на планах.

## ВАЖНО: Ответ СТРОГО в формате JSON без дополнительных текстов. Только валидный JSON.

Формат ответа:
{
  "wallMaterials": [
    {
      "material": "Обои виниловые",
      "description": "Обои виниловые, фактурные, цвет бежевый",
      "area": 25.5
    }
  ],
  "floorMaterial": {
    "material": "Ламинат",
    "description": "Ламинат 32 класса, цвет дуб светлый",
    "area": 12.3
  },
  "ceilingMaterial": {
    "material": "Натяжной потолок",
    "description": "Натяжной потолок ПВХ, матовый, белый",
    "area": 12.3
  },
  "electrical": {
    "outlets": 4,
    "switches": 2,
    "fixtures": 3,
    "locations": [
      {
        "type": "outlet",
        "description": "Розетка у стены слева от окна"
      }
    ]
  },
  "openings": [
    {
      "type": "door",
      "width": 0.9,
      "height": 2.1,
      "description": "Дверь межкомнатная, открывается наружу"
    },
    {
      "type": "window",
      "width": 1.5,
      "height": 1.4,
      "description": "Окно пластиковое, двухстворчатое"
    }
  ],
  "dimensions": {
    "length": 4.2,
    "width": 2.9,
    "height": 2.7,
    "area": 12.18
  },
  "notes": [
    "Установка плинтуса по периметру",
    "Демонтаж старой отделки"
  ]
}`

/**
 * Обнаружить важные области с точными данными на страницах помещения
 * @param roomPages Массив data URLs изображений помещения (развертки, планы)
 * @returns Информация о важных областях на каждой странице
 */
export async function detectImportantRegions(
  roomPages: string[],
  imageDimensions?: Array<{ width: number; height: number }>
): Promise<Array<{ pageIndex: number; regions: ImportantRegion[] }>> {
  const apiKey = getApiKey()

  if (roomPages.length === 0) {
    return []
  }

  const content: MessageContent[] = []

  // Add image dimensions if provided
  let dimensionsInfo = ''
  if (imageDimensions && imageDimensions.length === roomPages.length) {
    dimensionsInfo = `\n\nВАЖНО: Размеры изображений:\n${imageDimensions
      .map((dim, idx) => `Изображение ${idx + 1}: ${dim.width}x${dim.height} пикселей`)
      .join('\n')}\n\nКоординаты должны быть указаны относительно этих размеров. x=0, y=0 — это верхний левый угол изображения.`
  }

  content.push({
    type: 'text',
    text: `Найди важные области с точными данными (таблицы, спецификации, размеры) на ${roomPages.length} изображениях помещения. Для каждой области определи координаты (x, y, width, height в пикселях) и тип.${dimensionsInfo}`,
  })

  for (let i = 0; i < roomPages.length; i++) {
    content.push({
      type: 'image_url',
      image_url: {
        url: roomPages[i],
      },
    })
    const dimInfo = imageDimensions && imageDimensions[i]
      ? ` (${imageDimensions[i].width}x${imageDimensions[i].height}px)`
      : ''
    content.push({
      type: 'text',
      text: `Изображение ${i + 1}${dimInfo}`,
    })
  }

  content.push({
    type: 'text',
    text: '\nВерни JSON массив с информацией о важных областях для каждого изображения.',
  })

  const requestBodyStr = JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: IMPORTANT_REGIONS_DETECTION_PROMPT,
      },
      {
        role: 'user',
        content,
      },
    ],
    temperature: 0.1,
    max_tokens: 4000,
  })

  const requestBodyBuffer = Buffer.from(requestBodyStr, 'utf-8')
  console.log(`[AI] Detecting important regions on ${roomPages.length} room pages...`)

  const responseText = await makeOpenRouterRequest(apiKey, requestBodyBuffer)

  let response: {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
    error?: {
      message?: string
    }
  }

  try {
    response = JSON.parse(responseText)
  } catch {
    throw new Error('Не удалось распарсить ответ от OpenRouter API')
  }

  if (response.error) {
    throw new Error(`OpenRouter API: ${response.error.message || 'Неизвестная ошибка'}`)
  }

  const responseContent = response.choices?.[0]?.message?.content
  if (!responseContent) {
    throw new Error('ИИ не вернул ответ. Попробуйте снова.')
  }

  let jsonStr = responseContent.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  let results: Array<{ pageIndex: number; regions: ImportantRegion[] }>
  try {
    const parsed = JSON.parse(jsonStr)
    results = Array.isArray(parsed)
      ? parsed.map((item: any) => ({
          pageIndex: Number(item.pageIndex) || 0,
          regions: Array.isArray(item.regions)
            ? item.regions.map((region: any) => ({
                x: Number(region.x) || 0,
                y: Number(region.y) || 0,
                width: Number(region.width) || 0,
                height: Number(region.height) || 0,
                type: (region.type || 'table') as ImportantRegion['type'],
                description: String(region.description || ''),
              }))
            : [],
        }))
      : []
  } catch (err) {
    console.error('[AI] Failed to parse regions detection JSON:', jsonStr.substring(0, 500))
    throw new Error('ИИ вернул некорректный формат данных при обнаружении важных областей.')
  }

  console.log(
    `[AI] Detected ${results.reduce((sum, r) => sum + r.regions.length, 0)} important regions on ${results.length} pages`
  )
  return results
}

/**
 * Извлечь данные помещения из изображений
 * @param roomName Название помещения
 * @param fullPageImages Массив data URLs полных изображений помещения (миниатюры для контекста)
 * @param highQualityRegions Массив data URLs важных областей в высоком разрешении
 * @returns Извлеченные данные помещения
 */
export async function extractRoomData(
  roomName: string,
  fullPageImages: string[],
  highQualityRegions: string[]
): Promise<RoomExtractionResult> {
  const apiKey = getApiKey()

  if (fullPageImages.length === 0 && highQualityRegions.length === 0) {
    throw new Error('Необходимо предоставить хотя бы одно изображение помещения')
  }

  const content: MessageContent[] = []

  content.push({
    type: 'text',
    text: `Извлеки детальную информацию о помещении "${roomName}" из изображений.`,
  })

  // Add full page images first (for context, thumbnails)
  if (fullPageImages.length > 0) {
    content.push({
      type: 'text',
      text: '\n=== ПОЛНЫЕ ИЗОБРАЖЕНИЯ ПОМЕЩЕНИЯ (для контекста) ===',
    })
    for (let i = 0; i < fullPageImages.length; i++) {
      content.push({
        type: 'image_url',
        image_url: {
          url: fullPageImages[i],
        },
      })
      content.push({
        type: 'text',
        text: `Изображение ${i + 1}`,
      })
    }
  }

  // Add high-quality regions (for precise data extraction)
  if (highQualityRegions.length > 0) {
    content.push({
      type: 'text',
      text: '\n=== ВАЖНЫЕ ОБЛАСТИ В ВЫСОКОМ РАЗРЕШЕНИИ (для точного извлечения данных) ===\nВнимательно извлеки точные значения из этих областей.',
    })
    for (let i = 0; i < highQualityRegions.length; i++) {
      content.push({
        type: 'image_url',
        image_url: {
          url: highQualityRegions[i],
        },
      })
      content.push({
        type: 'text',
        text: `Важная область ${i + 1}`,
      })
    }
  }

  content.push({
    type: 'text',
    text: '\nВерни JSON с извлеченными данными помещения. Помни: используй ТОЛЬКО данные из изображений, не выдумывай числа!',
  })

  const requestBodyStr = JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: ROOM_DATA_EXTRACTION_PROMPT,
      },
      {
        role: 'user',
        content,
      },
    ],
    temperature: 0.1,
    max_tokens: 8000,
  })

  const requestBodyBuffer = Buffer.from(requestBodyStr, 'utf-8')
  const sizeMB = (requestBodyBuffer.length / (1024 * 1024)).toFixed(1)
  console.log(
    `[AI] Extracting room data for "${roomName}": ${fullPageImages.length} full pages, ${highQualityRegions.length} high-quality regions (request size: ${sizeMB} MB)...`
  )

  const responseText = await makeOpenRouterRequest(apiKey, requestBodyBuffer)

  let response: {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
    error?: {
      message?: string
    }
  }

  try {
    response = JSON.parse(responseText)
  } catch {
    throw new Error('Не удалось распарсить ответ от OpenRouter API')
  }

  if (response.error) {
    throw new Error(`OpenRouter API: ${response.error.message || 'Неизвестная ошибка'}`)
  }

  const responseContent = response.choices?.[0]?.message?.content
  if (!responseContent) {
    throw new Error('ИИ не вернул ответ. Попробуйте снова.')
  }

  let jsonStr = responseContent.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  let result: RoomExtractionResult
  try {
    const parsed = JSON.parse(jsonStr)
    result = {
      wallMaterials: Array.isArray(parsed.wallMaterials)
        ? parsed.wallMaterials.map((m: any) => ({
            material: String(m.material || ''),
            description: String(m.description || ''),
            area: m.area ? Number(m.area) : undefined,
          }))
        : [],
      floorMaterial: parsed.floorMaterial
        ? {
            material: String(parsed.floorMaterial.material || ''),
            description: String(parsed.floorMaterial.description || ''),
            area: parsed.floorMaterial.area ? Number(parsed.floorMaterial.area) : undefined,
          }
        : null,
      ceilingMaterial: parsed.ceilingMaterial
        ? {
            material: String(parsed.ceilingMaterial.material || ''),
            description: String(parsed.ceilingMaterial.description || ''),
            area: parsed.ceilingMaterial.area ? Number(parsed.ceilingMaterial.area) : undefined,
          }
        : null,
      electrical: {
        outlets: parsed.electrical?.outlets ? Number(parsed.electrical.outlets) : 0,
        switches: parsed.electrical?.switches ? Number(parsed.electrical.switches) : 0,
        fixtures: parsed.electrical?.fixtures ? Number(parsed.electrical.fixtures) : 0,
        locations: Array.isArray(parsed.electrical?.locations)
          ? parsed.electrical.locations.map((loc: any) => ({
              type: (loc.type || 'outlet') as 'outlet' | 'switch' | 'fixture',
              description: String(loc.description || ''),
            }))
          : undefined,
      },
      openings: Array.isArray(parsed.openings)
        ? parsed.openings.map((op: any) => ({
            type: (op.type || 'door') as 'door' | 'window' | 'arch',
            width: op.width ? Number(op.width) : undefined,
            height: op.height ? Number(op.height) : undefined,
            description: String(op.description || ''),
          }))
        : [],
      dimensions: parsed.dimensions
        ? {
            length: parsed.dimensions.length ? Number(parsed.dimensions.length) : undefined,
            width: parsed.dimensions.width ? Number(parsed.dimensions.width) : undefined,
            height: parsed.dimensions.height ? Number(parsed.dimensions.height) : undefined,
            area: parsed.dimensions.area ? Number(parsed.dimensions.area) : undefined,
          }
        : {},
      notes: Array.isArray(parsed.notes) ? parsed.notes.map((n: any) => String(n)) : undefined,
    }
  } catch (err) {
    console.error('[AI] Failed to parse room extraction JSON:', jsonStr.substring(0, 500))
    throw new Error('ИИ вернул некорректный формат данных. Попробуйте снова.')
  }

  console.log(
    `[AI] Extracted room data for "${roomName}": ${result.wallMaterials.length} wall materials, ${result.openings.length} openings, ${result.electrical.outlets} outlets`
  )

  return result
}

const MATERIAL_BILL_EXTRACTION_PROMPT = `Ты — эксперт по анализу таблиц с ведомостями материалов из дизайн-проектов. Твоя задача — точно извлечь все данные из таблиц ведомостей материалов.

## КРИТИЧЕСКИ ВАЖНО:
1. **Извлеки ВСЕ строки из таблицы** — не пропускай ни одной позиции.
2. **Используй ТОЛЬКО данные из таблицы** — не выдумывай информацию.
3. **Сохрани точные значения**: названия материалов, количества, единицы измерения, артикулы, марки — всё ТОЧНО как написано в таблице.
4. **Если в таблице несколько колонок** (№, Наименование, Ед. изм., Количество, Артикул, Марка, Производитель, Примечания) — извлеки данные из всех колонок.
5. **Если какое-то поле пустое** — ставь null или не включай в результат.

## Инструкции:
1. Определи название таблицы (например, "Ведомость материалов", "Спецификация материалов").
2. Извлеки все строки с материалами из таблицы.
3. Для каждой строки извлеки:
   - Позицию (№ в таблице)
   - Наименование материала (ТОЧНО как написано)
   - Единицу измерения (м², м.п., шт и т.д.)
   - Количество (число, если указано)
   - Артикул (если есть колонка)
   - Марку/Бренд (если есть колонка)
   - Производителя (если есть колонка)
   - Примечания/Описание (если есть колонка)

## ВАЖНО: Ответ СТРОГО в формате JSON без дополнительных текстов. Только валидный JSON.

Формат ответа:
{
  "title": "Ведомость материалов",
  "roomName": "Кухня",
  "items": [
    {
      "position": 1,
      "name": "Обои виниловые",
      "unit": "м²",
      "quantity": 25.5,
      "article": "OB-12345",
      "brand": "Elegant",
      "manufacturer": "ООО Производитель",
      "description": "Цвет бежевый"
    },
    {
      "position": 2,
      "name": "Ламинат",
      "unit": "м²",
      "quantity": 12.3,
      "article": null,
      "brand": "32 класс",
      "manufacturer": null,
      "description": "Цвет дуб светлый"
    }
  ]
}`

/**
 * Извлечь данные из таблиц ведомостей материалов
 * @param tableImages Массив data URLs изображений таблиц с ведомостями материалов
 * @returns Извлеченные данные из таблиц
 */
export async function extractMaterialBills(
  tableImages: string[]
): Promise<MaterialBill[]> {
  const apiKey = getApiKey()

  if (tableImages.length === 0) {
    return []
  }

  const content: MessageContent[] = []

  content.push({
    type: 'text',
    text: `Извлеки ВСЕ данные из таблиц с ведомостями материалов. В проекте ${tableImages.length} таблиц. Для каждой таблицы извлеки название, все строки с материалами и их характеристики.`,
  })

  for (let i = 0; i < tableImages.length; i++) {
    content.push({
      type: 'image_url',
      image_url: {
        url: tableImages[i],
      },
    })
    content.push({
      type: 'text',
      text: `Таблица ${i + 1} — извлеки ВСЕ строки с материалами.`,
    })
  }

  content.push({
    type: 'text',
    text: '\nВерни JSON массив с данными из всех таблиц. Помни: извлеки ВСЕ строки, используй ТОЛЬКО данные из таблиц!',
  })

  const requestBodyStr = JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: MATERIAL_BILL_EXTRACTION_PROMPT,
      },
      {
        role: 'user',
        content,
      },
    ],
    temperature: 0.1,
    max_tokens: 16000, // Больше токенов для больших таблиц
  })

  const requestBodyBuffer = Buffer.from(requestBodyStr, 'utf-8')
  const sizeMB = (requestBodyBuffer.length / (1024 * 1024)).toFixed(1)
  console.log(
    `[AI] Extracting material bills from ${tableImages.length} tables (request size: ${sizeMB} MB)...`
  )

  const responseText = await makeOpenRouterRequest(apiKey, requestBodyBuffer)

  let response: {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
    error?: {
      message?: string
    }
  }

  try {
    response = JSON.parse(responseText)
  } catch {
    throw new Error('Не удалось распарсить ответ от OpenRouter API')
  }

  if (response.error) {
    throw new Error(`OpenRouter API: ${response.error.message || 'Неизвестная ошибка'}`)
  }

  const responseContent = response.choices?.[0]?.message?.content
  if (!responseContent) {
    throw new Error('ИИ не вернул ответ. Попробуйте снова.')
  }

  let jsonStr = responseContent.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  let bills: MaterialBill[]
  try {
    const parsed = JSON.parse(jsonStr)
    
    // Handle both array and single object
    const billsArray = Array.isArray(parsed) ? parsed : [parsed]
    
    bills = billsArray.map((bill: any) => ({
      title: String(bill.title || 'Ведомость материалов'),
      roomName: bill.roomName ? String(bill.roomName) : undefined,
      items: Array.isArray(bill.items)
        ? bill.items.map((item: any) => ({
            position: Number(item.position) || 0,
            name: String(item.name || ''),
            unit: String(item.unit || 'шт'),
            quantity: item.quantity !== null && item.quantity !== undefined ? Number(item.quantity) : null,
            article: item.article ? String(item.article) : undefined,
            brand: item.brand ? String(item.brand) : undefined,
            manufacturer: item.manufacturer ? String(item.manufacturer) : undefined,
            description: item.description ? String(item.description) : undefined,
          }))
        : [],
    }))
  } catch (err) {
    console.error('[AI] Failed to parse material bills JSON:', jsonStr.substring(0, 500))
    throw new Error('ИИ вернул некорректный формат данных при извлечении ведомостей материалов.')
  }

  const totalItems = bills.reduce((sum, bill) => sum + bill.items.length, 0)
  console.log(
    `[AI] Extracted ${bills.length} material bills with ${totalItems} total items`
  )

  return bills
}
