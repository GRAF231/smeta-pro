import https from 'https'

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
