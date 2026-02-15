/**
 * Смета из базы данных
 */
export interface EstimateRow {
  id: string
  brigadir_id: string
  google_sheet_id: string
  title: string
  customer_link_token: string
  master_link_token: string
  column_mapping: string
  master_password: string | null
  balance: number
  customer_email: string | null
  customer_phone: string | null
  customer_name: string | null
  last_synced_at: string | null
  created_at: string
}

/**
 * Раздел сметы из базы данных
 */
export interface SectionRow {
  id: string
  estimate_id: string
  name: string
  sort_order: number
}

/**
 * Позиция сметы из базы данных
 */
export interface ItemRow {
  id: string
  estimate_id: string
  section_id: string
  number: string
  name: string
  unit: string
  quantity: number
  sort_order: number
}

/**
 * Представление сметы из базы данных
 */
export interface ViewRow {
  id: string
  estimate_id: string
  name: string
  link_token: string
  password: string | null
  sort_order: number
  is_customer_view: number
  created_at: string
}

/**
 * Настройки видимости раздела для представления
 */
export interface ViewSectionSettingRow {
  id: string
  view_id: string
  section_id: string
  visible: number
}

/**
 * Настройки позиции для представления
 */
export interface ViewItemSettingRow {
  id: string
  view_id: string
  item_id: string
  price: number
  total: number
  visible: number
}

/**
 * Версия сметы из базы данных
 */
export interface VersionRow {
  id: string
  estimate_id: string
  version_number: number
  name: string | null
  created_at: string
}

/**
 * Раздел версии сметы из базы данных
 */
export interface VersionSectionRow {
  id: string
  version_id: string
  original_section_id: string
  name: string
  sort_order: number
}

/**
 * Позиция версии сметы из базы данных
 */
export interface VersionItemRow {
  id: string
  version_id: string
  version_section_id: string
  original_item_id: string
  number: string
  name: string
  unit: string
  quantity: number
  sort_order: number
}

/**
 * Представление версии сметы из базы данных
 */
export interface VersionViewRow {
  id: string
  version_id: string
  original_view_id: string
  name: string
  sort_order: number
}

/**
 * Настройки видимости раздела для представления версии
 */
export interface VersionViewSectionSettingRow {
  id: string
  version_id: string
  version_view_id: string
  version_section_id: string
  visible: number
}

/**
 * Настройки позиции для представления версии
 */
export interface VersionViewItemSettingRow {
  id: string
  version_id: string
  version_view_id: string
  version_item_id: string
  price: number
  total: number
  visible: number
}

/**
 * Изображение для акта из базы данных
 */
export interface ActImageRow {
  id: string
  estimate_id: string
  image_type: string
  data: string
  created_at: string
}

/**
 * Сохраненный акт из базы данных
 */
export interface SavedActRow {
  id: string
  estimate_id: string
  view_id: string | null
  act_number: string
  act_date: string
  executor_name: string
  executor_details: string
  customer_name: string
  director_name: string
  service_name: string
  selection_mode: string
  grand_total: number
  created_at: string
}

/**
 * Позиция сохраненного акта из базы данных
 */
export interface SavedActItemRow {
  id: string
  act_id: string
  item_id: string | null
  section_id: string | null
  name: string
  unit: string
  quantity: number
  price: number
  total: number
}

/**
 * Настройки представления для раздела
 */
export interface SectionViewSettings {
  [viewId: string]: {
    visible: boolean
  }
}

/**
 * Настройки представления для позиции
 */
export interface ItemViewSettings {
  [viewId: string]: {
    price: number
    total: number
    visible: boolean
  }
}

/**
 * Позиция сметы с настройками представлений
 */
export interface EstimateItem {
  id: string
  number: string
  name: string
  unit: string
  quantity: number
  sortOrder: number
  viewSettings: ItemViewSettings
}

/**
 * Раздел сметы с позициями и настройками представлений
 */
export interface EstimateSection {
  id: string
  name: string
  sortOrder: number
  viewSettings: SectionViewSettings
  items: EstimateItem[]
}

/**
 * Представление сметы
 */
export interface EstimateView {
  id: string
  name: string
  linkToken: string
  password: string
  sortOrder: number
  isCustomerView: boolean
}

/**
 * Полный ответ со сметой
 */
export interface EstimateResponse {
  id: string
  title: string
  googleSheetId: string
  balance: number
  lastSyncedAt: string | null
  createdAt: string
  views: EstimateView[]
  sections: EstimateSection[]
}

/**
 * Краткая информация о смете (для списка)
 */
export interface EstimateListItem {
  id: string
  title: string
  googleSheetId: string
  balance: number
  lastSyncedAt: string | null
  createdAt: string
  views: EstimateView[]
}

/**
 * Данные для создания сметы
 */
export interface CreateEstimateInput {
  title: string
  googleSheetUrl?: string
}

/**
 * Данные для обновления сметы
 */
export interface UpdateEstimateInput {
  title: string
  googleSheetUrl?: string
}

/**
 * Данные для создания раздела
 */
export interface CreateSectionInput {
  name: string
}

/**
 * Данные для обновления раздела
 */
export interface UpdateSectionInput {
  name: string
}

/**
 * Данные для создания позиции
 */
export interface CreateItemInput {
  sectionId: string
  name: string
  unit?: string
  quantity?: number
}

/**
 * Данные для обновления позиции
 */
export interface UpdateItemInput {
  name?: string
  unit?: string
  quantity?: number
}

/**
 * Данные для создания представления
 */
export interface CreateViewInput {
  name: string
}

/**
 * Данные для обновления представления
 */
export interface UpdateViewInput {
  name?: string
  password?: string
}

/**
 * Данные для обновления настроек раздела в представлении
 */
export interface UpdateViewSectionSettingsInput {
  visible: boolean
}

/**
 * Данные для обновления настроек позиции в представлении
 */
export interface UpdateViewItemSettingsInput {
  price?: number
  visible?: boolean
}

/**
 * Данные для создания версии
 */
export interface CreateVersionInput {
  name?: string
}

/**
 * Информация о версии
 */
export interface VersionInfo {
  id: string
  versionNumber: number
  name: string | null
  createdAt: string
}

/**
 * Данные для создания акта
 */
export interface CreateActInput {
  viewId?: string
  actNumber: string
  actDate?: string
  executorName?: string
  executorDetails?: string
  customerName?: string
  directorName?: string
  serviceName?: string
  selectionMode?: 'sections' | 'items'
  grandTotal?: number
  items: Array<{
    itemId?: string
    sectionId?: string
    name: string
    unit?: string
    quantity?: number
    price?: number
    total?: number
  }>
}

/**
 * Информация об акте
 */
export interface ActInfo {
  id: string
  actNumber: string
  actDate: string
  executorName: string
  customerName: string
  selectionMode: string
  grandTotal: number
  createdAt: string
}

/**
 * Полная информация об акте с позициями
 */
export interface ActDetails extends ActInfo {
  executorDetails: string
  directorName: string
  serviceName: string
  items: Array<{
    id: string
    itemId: string | null
    sectionId: string | null
    name: string
    unit: string
    quantity: number
    price: number
    total: number
  }>
}

/**
 * Маппинг использованных позиций по актам
 */
export interface UsedItemsMapping {
  [itemId: string]: Array<{
    actId: string
    actNumber: string
    actDate: string
  }>
}

/**
 * Данные для генерации сметы из PDF
 */
export interface GenerateEstimateFromPDFInput {
  title: string
  pricelistUrl: string
  comments?: string
}

/**
 * Данные для синхронизации с Google Sheets
 */
export interface SyncEstimateInput {
  googleSheetUrl?: string
}

/**
 * Публичные данные представления (для заказчика/мастера)
 */
export interface PublicViewSection {
  name: string
  items: Array<{
    number: string
    name: string
    unit: string
    quantity: number
    price: number
    total: number
    paidAmount: number
    completedAmount: number
  }>
  subtotal: number
}

/**
 * Публичный ответ со сметой
 */
export interface PublicViewResponse {
  title: string
  viewName: string
  sections: PublicViewSection[]
  total: number
  balance: number
}

/**
 * Ответ с требованием пароля
 */
export interface PasswordRequiredResponse {
  requiresPassword: boolean
  title: string
  viewName?: string
}

/**
 * Данные для проверки пароля
 */
export interface VerifyPasswordInput {
  password: string
}

/**
 * Данные для загрузки изображения акта
 */
export interface UploadActImageInput {
  imageType: 'logo' | 'stamp' | 'signature'
  data: string
}

// ========== AI GENERATION TYPES ==========

/**
 * Задача генерации сметы из базы данных
 */
export interface GenerationTaskRow {
  id: string
  estimate_id: string | null
  user_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  current_stage: string | null
  progress_percent: number
  error_message: string | null
  created_at: string
  updated_at: string
}

/**
 * Промежуточные данные генерации из базы данных
 */
export interface IntermediateDataRow {
  id: string
  task_id: string
  stage: string
  data_type: string
  data_json: string
  created_at: string
}

/**
 * Классификация страницы PDF из базы данных
 */
export interface PageClassificationRow {
  id: string
  task_id: string
  page_number: number
  page_type: 'plan' | 'wall_layout' | 'specification' | 'visualization' | 'other'
  room_name: string | null
  image_data_url: string | null
  created_at: string
}

/**
 * Извлеченные данные помещения из базы данных
 */
export interface ExtractedRoomDataRow {
  id: string
  task_id: string
  room_name: string
  room_type: string | null
  area: number | null
  wall_area: number | null
  floor_area: number | null
  ceiling_area: number | null
  extracted_data_json: string
  created_at: string
}

// ========== PAYMENT TYPES ==========

/**
 * Платеж из базы данных
 */
export interface PaymentRow {
  id: string
  estimate_id: string
  amount: number
  payment_date: string
  notes: string
  status: 'manual' | 'draft' | 'pending' | 'succeeded' | 'canceled'
  payment_method: 'manual' | 'yookassa'
  yookassa_invoice_id: string | null
  yookassa_payment_id: string | null
  payment_url: string | null
  paid_at: string | null
  created_at: string
}

/**
 * Позиция платежа из базы данных
 */
export interface PaymentItemRow {
  id: string
  payment_id: string
  item_id: string
  amount: number
}

/**
 * Данные для создания платежа
 */
export interface CreatePaymentInput {
  amount: number
  paymentDate: string
  notes?: string
  items: Array<{
    itemId: string
    amount: number
  }>
  paymentMethod?: 'manual' | 'yookassa'
}

/**
 * Данные для создания счета через ЮKassa
 */
export interface CreateYookassaInvoiceInput {
  amount: number
  paymentDate: string
  notes?: string
  items: Array<{
    itemId: string
    amount: number
  }>
  customerEmail?: string
  customerPhone?: string
  customerName?: string
}

/**
 * Информация о платеже
 */
export interface PaymentInfo {
  id: string
  amount: number
  paymentDate: string
  notes: string
  status: 'manual' | 'draft' | 'pending' | 'succeeded' | 'canceled'
  paymentMethod: 'manual' | 'yookassa'
  yookassaInvoiceId?: string | null
  yookassaPaymentId?: string | null
  paymentUrl?: string | null
  paidAt?: string | null
  createdAt: string
  items: Array<{
    id: string
    itemId: string
    amount: number
  }>
}

/**
 * Запрос на создание счета в ЮKassa
 */
export interface YookassaInvoiceRequest {
  amount: {
    value: string
    currency: string
  }
  description: string
  capture: boolean
  receipt?: {
    customer: {
      email?: string
      phone?: string
      full_name?: string
    }
    items: Array<{
      description: string
      quantity: string
      amount: {
        value: string
        currency: string
      }
      vat_code?: number
    }>
  }
  confirmation: {
    type: 'redirect'
    return_url: string
  }
  metadata?: {
    payment_id: string
    estimate_id: string
  }
}

/**
 * Ответ от ЮKassa при создании счета
 */
export interface YookassaInvoiceResponse {
  id: string
  status: string
  amount: {
    value: string
    currency: string
  }
  description: string
  created_at: string
  paid_at?: string
  confirmation: {
    type: string
    confirmation_url: string
  }
  metadata?: {
    payment_id?: string
    estimate_id?: string
  }
}

/**
 * Событие webhook от ЮKassa
 */
export interface YookassaWebhookEvent {
  type: string
  event: string
  object: {
    id: string
    status: string
    amount: {
      value: string
      currency: string
    }
    description?: string
    created_at: string
    paid_at?: string
    metadata?: {
      payment_id?: string
      estimate_id?: string
    }
  }
}

/**
 * Статус пункта сметы (оплачено/выполнено)
 */
export interface ItemStatus {
  itemId: string
  paidAmount: number
  completedAmount: number
}

