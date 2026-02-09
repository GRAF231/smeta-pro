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
