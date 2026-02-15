import crypto from 'crypto'
import {
  YookassaInvoiceRequest,
  YookassaInvoiceResponse,
  YookassaWebhookEvent,
} from '../types/estimate'
import { ConfigurationError } from '../utils/errors'

/**
 * Сервис для работы с API ЮKassa
 */
export class YookassaService {
  private shopId: string = ''
  private secretKey: string = ''
  private baseUrl: string = ''
  private returnUrl: string = ''
  private configLoaded: boolean = false

  constructor() {
    // Не загружаем конфигурацию в конструкторе, чтобы dotenv.config() успел выполниться
    // Конфигурация будет загружена при первом использовании
  }

  /**
   * Загрузить конфигурацию из переменных окружения
   */
  private loadConfig(): void {
    if (this.configLoaded) {
      return // Уже загружено
    }

    this.shopId = process.env.YOOKASSA_SHOP_ID || ''
    this.secretKey = process.env.YOOKASSA_SECRET_KEY || ''
    
    // Используем sandbox для тестирования, если не указан production режим
    const isProduction = process.env.YOOKASSA_PRODUCTION === 'true'
    this.baseUrl = isProduction
      ? 'https://api.yookassa.ru/v3'
      : 'https://api.yookassa.ru/v3' // Sandbox использует тот же URL, но другие credentials
    
    // URL для возврата после оплаты
    this.returnUrl = process.env.YOOKASSA_RETURN_URL || 'http://localhost:3000/payment/success'

    this.configLoaded = true

    // Отладочный вывод только при первом использовании (не в конструкторе)
    // Логи будут выводиться при первом вызове isConfigured() или createInvoice()
  }

  /**
   * Проверить, настроены ли учетные данные ЮKassa
   */
  isConfigured(): boolean {
    this.loadConfig()
    const configured = !!(this.shopId && this.secretKey)
    
    // Выводим информацию только один раз при первом вызове
    if (this.configLoaded && configured) {
      // Логи уже выведены при загрузке, не дублируем
    }
    
    return configured
  }

  /**
   * Создать счет через API ЮKassa
   */
  async createInvoice(request: YookassaInvoiceRequest): Promise<YookassaInvoiceResponse> {
    this.loadConfig()
    
    if (!this.shopId || !this.secretKey) {
      throw new ConfigurationError(
        'Учетные данные ЮKassa не настроены. Пожалуйста, настройте переменные окружения YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY.'
      )
    }

    const url = `${this.baseUrl}/payments`
    const auth = Buffer.from(`${this.shopId}:${this.secretKey}`).toString('base64')

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
          'Idempotence-Key': this.generateIdempotenceKey(),
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('YooKassa API error:', errorText)
        throw new Error(`YooKassa API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data as YookassaInvoiceResponse
    } catch (error) {
      console.error('Error creating YooKassa invoice:', error)
      throw error
    }
  }

  /**
   * Получить статус платежа
   */
  async getPaymentStatus(paymentId: string): Promise<YookassaInvoiceResponse> {
    this.loadConfig()
    
    if (!this.shopId || !this.secretKey) {
      throw new ConfigurationError(
        'Учетные данные ЮKassa не настроены. Пожалуйста, настройте переменные окружения YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY.'
      )
    }

    const url = `${this.baseUrl}/payments/${paymentId}`
    const auth = Buffer.from(`${this.shopId}:${this.secretKey}`).toString('base64')

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`YooKassa API error for payment ${paymentId}:`, response.status, errorText)
        throw new Error(`YooKassa API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log(`YooKassa payment status response for ${paymentId}:`, JSON.stringify(data, null, 2))
      return data as YookassaInvoiceResponse
    } catch (error) {
      console.error('Error getting YooKassa payment status:', error)
      throw error
    }
  }

  /**
   * Проверить подпись webhook
   * 
   * ЮKassa отправляет подпись в заголовке X-YooMoney-Signature
   * Формат: hex(sha256(notification + & + secret))
   */
  verifyWebhookSignature(
    notification: string,
    signature: string
  ): boolean {
    if (!this.secretKey) {
      console.warn('YooKassa secret key not configured, skipping signature verification')
      return true // В development режиме пропускаем проверку
    }

    // Для проверки подписи нужно использовать crypto
    const expectedSignature = crypto
      .createHash('sha256')
      .update(notification + '&' + this.secretKey)
      .digest('hex')

    return expectedSignature === signature
  }

  /**
   * Генерация ключа идемпотентности
   */
  private generateIdempotenceKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }
}

export const yookassaService = new YookassaService()

