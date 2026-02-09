# Паттерны разработки для ИИ-ассистентов

Этот документ описывает стандартные паттерны и подходы, используемые в проекте. Следуйте этим паттернам при создании нового кода или рефакторинге существующего.

## Содержание

1. [Создание нового API хука](#создание-нового-api-хука)
2. [Создание нового компонента](#создание-нового-компонента)
3. [Создание новой страницы](#создание-новой-страницы)
4. [Обработка ошибок](#обработка-ошибок)
5. [Работа с формами](#работа-с-формами)
6. [Работа с типами](#работа-с-типами)
7. [Организация файлов](#организация-файлов)

---

## Создание нового API хука

### Паттерн

Все API хуки следуют единому паттерну, описанному в `src/hooks/api/README.md`.

### Шаблон

```typescript
/**
 * Hook for [resource] API operations
 * 
 * Provides state management and operations for [resource] including:
 * - Loading [resource] list
 * - Creating new [resource]
 * - Updating existing [resource]
 * - Deleting [resource]
 * 
 * @param [param] - [Description] (undefined to disable operations)
 * @returns Object containing:
 * - `[resources]` - Array of all [resources]
 * - `isLoading` - Loading state flag
 * - `error` - Error message string (empty if no error)
 * - `load[Resources]` - Function to fetch all [resources]
 * - `create[Resource]` - Function to create a new [resource]
 * - `update[Resource]` - Function to update an existing [resource]
 * - `delete[Resource]` - Function to delete a [resource]
 * - `setError` - Function to manually set error state
 * 
 * @example
 * ```tsx
 * const { [resources], isLoading, load[Resources], create[Resource] } = use[Resources]([param])
 * 
 * useEffect(() => {
 *   load[Resources]()
 * }, [[param]])
 * 
 * const handleCreate = async () => {
 *   try {
 *     await create[Resource]({ ... })
 *     await load[Resources]()
 *   } catch (err) {
 *     // Error is automatically set in hook state
 *   }
 * }
 * ```
 */
export function use[Resources]([param]: [Type] | undefined) {
  const [[resources], set[Resources]] = useState<[Resource][]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const load[Resources] = useCallback(async () => {
    if (![param]) return
    setIsLoading(true)
    setError('')
    try {
      const res = await [api].[getAll]([param])
      set[Resources](res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки [resources]'))
    } finally {
      setIsLoading(false)
    }
  }, [[param]])

  const create[Resource] = useCallback(async (data: Create[Resource]Data) => {
    if (![param]) return
    setIsLoading(true)
    setError('')
    try {
      const res = await [api].[create]([param], data)
      set[Resources](prev => [...prev, res.data])
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка создания [resource]'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [[param]])

  // ... другие операции

  return {
    [resources],
    isLoading,
    error,
    load[Resources],
    create[Resource],
    // ...
    setError,
  }
}
```

### Обязательные элементы

1. ✅ **JSDoc комментарий** с описанием, параметрами, возвращаемыми значениями и примером
2. ✅ **Единообразные возвращаемые значения**: `data`, `isLoading`, `error`, операции, `setError`
3. ✅ **Обработка ошибок** через `getErrorMessage` из `utils/errors`
4. ✅ **Управление состоянием загрузки** через `isLoading`
5. ✅ **Проверка параметров** перед выполнением операций
6. ✅ **Типизация** всех параметров и возвращаемых значений

### Что делать

- ✅ Использовать `useCallback` для всех функций
- ✅ Очищать ошибки перед новыми операциями
- ✅ Устанавливать `isLoading` в начале и сбрасывать в `finally`
- ✅ Использовать `getErrorMessage` для обработки ошибок
- ✅ Добавлять JSDoc с примерами

### Чего избегать

- ❌ Не использовать разные паттерны для разных хуков
- ❌ Не забывать обрабатывать ошибки
- ❌ Не забывать управлять состоянием загрузки
- ❌ Не использовать `any` типы
- ❌ Не создавать хуки без JSDoc документации

---

## Создание нового компонента

### Паттерн

Все компоненты UI находятся в `src/components/ui/` и следуют единому стилю.

### Шаблон

```typescript
import { ReactNode } from 'react'

/**
 * Props for [ComponentName] component
 */
export interface [ComponentName]Props {
  /** [Description of prop] */
  prop1: string
  /** [Description of prop] */
  prop2?: number
  /** Additional CSS classes */
  className?: string
  /** Component content */
  children?: ReactNode
}

/**
 * [ComponentName] component
 * 
 * [Detailed description of what the component does and when to use it]
 * 
 * Provides:
 * - [Feature 1]
 * - [Feature 2]
 * - [Feature 3]
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <[ComponentName] prop1="value" />
 * 
 * // With optional props
 * <[ComponentName]
 *   prop1="value"
 *   prop2={42}
 *   className="custom-class"
 * >
 *   Content
 * </[ComponentName]>
 * ```
 */
export default function [ComponentName]({
  prop1,
  prop2,
  className = '',
  children,
}: [ComponentName]Props) {
  return (
    <div className={`base-classes ${className}`}>
      {children}
    </div>
  )
}
```

### Обязательные элементы

1. ✅ **JSDoc комментарий** с описанием компонента, пропсов и примеров
2. ✅ **Типизация пропсов** через интерфейс
3. ✅ **Описание всех пропсов** в JSDoc
4. ✅ **Примеры использования** в JSDoc
5. ✅ **Консистентные CSS классы** (использовать существующие утилиты)

### Что делать

- ✅ Экспортировать интерфейс пропсов для переиспользования
- ✅ Использовать деструктуризацию пропсов
- ✅ Предоставлять значения по умолчанию для опциональных пропсов
- ✅ Добавлять `className` проп для кастомизации стилей
- ✅ Использовать семантические HTML элементы

### Чего избегать

- ❌ Не создавать компоненты без JSDoc
- ❌ Не использовать `any` для типов пропсов
- ❌ Не смешивать стили (использовать Tailwind классы консистентно)
- ❌ Не забывать про доступность (accessibility)
- ❌ Не создавать слишком сложные компоненты (разбивать на подкомпоненты)

---

## Создание новой страницы

### Паттерн

Все страницы следуют структуре, описанной в `src/pages/STRUCTURE.md`.

### Шаблон

```typescript
import { useParams } from 'react-router-dom'
import { PageSpinner } from '../../components/ui/Spinner'
import { use[Resource] } from '../../hooks/api/use[Resource]'

/**
 * [PageName] page component
 * 
 * [Description of what the page does and its purpose]
 * 
 * Features:
 * - [Feature 1]
 * - [Feature 2]
 * - [Feature 3]
 * 
 * @example
 * Used as a route in App.tsx:
 * ```tsx
 * <Route path="[route-path]" element={<[PageName] />} />
 * ```
 */
export default function [PageName]() {
  const params = useParams<{ id: string }>()
  const { data, isLoading, error, loadData } = use[Resource](params.id)

  useEffect(() => {
    if (params.id) {
      loadData()
    }
  }, [params.id])

  if (isLoading) return <PageSpinner />
  if (error) return <ErrorAlert message={error} />
  if (!data) return <EmptyState title="Not found" />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page content */}
    </div>
  )
}
```

### Структура директорий

```
pages/
  [PageName]/
    - index.tsx          # Основной компонент страницы
    - components/        # Подкомпоненты (если есть)
      - Component1.tsx
    - hooks/            # Специфичные хуки страницы (если есть)
      - useCustomHook.ts
    - utils/            # Утилиты страницы (если есть)
      - helpers.ts
```

### Обязательные элементы

1. ✅ **JSDoc комментарий** с описанием страницы и примером роутинга
2. ✅ **Обработка состояний загрузки** через `PageSpinner`
3. ✅ **Обработка ошибок** через `ErrorAlert`
4. ✅ **Обработка пустых состояний** через `EmptyState`
5. ✅ **Консистентная структура** с max-width контейнером

### Что делать

- ✅ Использовать существующие хуки из `hooks/api/`
- ✅ Разбивать сложную логику на отдельные хуки
- ✅ Использовать компоненты UI из `components/ui/`
- ✅ Следовать структуре директорий
- ✅ Добавлять JSDoc с примерами роутинга

### Чего избегать

- ❌ Не создавать страницы без JSDoc
- ❌ Не дублировать логику между страницами
- ❌ Не создавать слишком большие компоненты страниц (>200 строк)
- ❌ Не забывать обрабатывать состояния загрузки и ошибок
- ❌ Не смешивать логику и представление

---

## Обработка ошибок

### Паттерн

Все ошибки обрабатываются через единый подход, описанный в `src/hooks/utils/useErrorHandling.ts`.

### Стандартный подход

```typescript
import { getErrorMessage } from '../../utils/errors'

try {
  const res = await api.someOperation()
  return res.data
} catch (err) {
  const errorMessage = getErrorMessage(err, 'Сообщение по умолчанию')
  setError(errorMessage)
  throw err // Опционально, если нужно пробросить ошибку дальше
}
```

### Использование useErrorHandling

```typescript
import { useErrorHandling } from '../../hooks/utils/useErrorHandling'

function useMyHook() {
  const { error, handleError, clearError } = useErrorHandling({
    defaultErrorMessage: 'Произошла ошибка',
    onError: (message) => {
      // Дополнительная обработка
    },
  })

  const fetchData = async () => {
    try {
      const res = await api.getData()
      return res.data
    } catch (err) {
      handleError(err, 'Ошибка загрузки данных')
      throw err
    }
  }

  return { error, fetchData, clearError }
}
```

### Что делать

- ✅ Использовать `getErrorMessage` для извлечения сообщений об ошибках
- ✅ Предоставлять понятные сообщения по умолчанию
- ✅ Использовать `useErrorHandling` для стандартизации
- ✅ Обрабатывать ошибки на всех уровнях (хуки, компоненты, страницы)
- ✅ Показывать пользователю понятные сообщения об ошибках

### Чего избегать

- ❌ Не использовать разные подходы к обработке ошибок
- ❌ Не показывать технические детали ошибок пользователю
- ❌ Не забывать обрабатывать ошибки в async операциях
- ❌ Не использовать `console.error` без логирования в систему
- ❌ Не игнорировать ошибки (всегда обрабатывать)

---

## Работа с формами

### Паттерн

Все формы используют хуки из `src/hooks/forms/`.

### Стандартный подход

```typescript
import { useFormState } from '../../hooks/forms/useFormState'
import { useFormSubmit } from '../../hooks/forms/useFormSubmit'
import { useFormValidation } from '../../hooks/forms/useFormValidation'

interface FormData {
  email: string
  password: string
}

function MyForm() {
  const form = useFormState<FormData>({
    email: '',
    password: '',
  })

  const rules = [
    createValidationRules.required<FormData>('email', 'Email'),
    createValidationRules.email<FormData>('email'),
    createValidationRules.required<FormData>('password', 'Password'),
  ]
  const { validate } = useFormValidation<FormData>(rules)

  const { isSubmitting, submitError, handleSubmit } = useFormSubmit<FormData>({
    onSubmit: async (values) => {
      await api.login(values)
    },
    onSuccess: () => {
      navigate('/dashboard')
    },
    validate: (values) => validate(values),
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(form.values, form.setAllErrors)
  }

  return (
    <form onSubmit={onSubmit}>
      <FormField label="Email" required error={form.errors.email} htmlFor="email">
        <Input
          id="email"
          type="email"
          value={form.values.email}
          onChange={(e) => form.setValue('email', e.target.value)}
          onBlur={() => form.setFieldTouched('email')}
          error={!!form.errors.email}
          errorMessage={form.errors.email}
        />
      </FormField>
      {/* ... другие поля */}
      <Button type="submit" loading={isSubmitting}>
        Submit
      </Button>
    </form>
  )
}
```

### Что делать

- ✅ Использовать `useFormState` для управления состоянием формы
- ✅ Использовать `useFormValidation` для валидации
- ✅ Использовать `useFormSubmit` для отправки формы
- ✅ Показывать ошибки валидации через `FormField` и `Input`
- ✅ Использовать `touched` для показа ошибок только после взаимодействия

### Чего избегать

- ❌ Не управлять состоянием формы вручную через `useState`
- ❌ Не валидировать формы без использования `useFormValidation`
- ❌ Не показывать ошибки валидации до взаимодействия пользователя
- ❌ Не забывать обрабатывать состояния загрузки при отправке
- ❌ Не создавать дублирующие хуки форм

---

## Работа с типами

### Паттерн

Все типы экспортируются через `src/types/index.ts` и организованы по доменам.

### Использование типов

```typescript
// Импорт из централизованного экспорта
import type {
  Project,
  ProjectId,
  EstimateItem,
  Material,
  User,
} from '@/types'

// Использование branded types
import { asProjectId, asViewId } from '@/types'

const projectId: ProjectId = asProjectId('123')
const viewId: ViewId = asViewId('456')
```

### Создание новых типов

```typescript
/**
 * [TypeName] type
 * 
 * [Description of what this type represents and when to use it]
 * 
 * @example
 * ```tsx
 * const data: [TypeName] = {
 *   // ...
 * }
 * ```
 */
export interface [TypeName] {
  /** [Description of field] */
  field1: string
  /** [Description of field] */
  field2?: number
}
```

### Что делать

- ✅ Импортировать типы из `src/types/index.ts`
- ✅ Использовать branded types для ID (ProjectId, ViewId, etc.)
- ✅ Добавлять JSDoc комментарии к типам
- ✅ Группировать связанные типы в одном файле
- ✅ Экспортировать типы через barrel export в `types/index.ts`

### Чего избегать

- ❌ Не определять типы локально, если они используются в нескольких местах
- ❌ Не использовать строки вместо branded types для ID
- ❌ Не создавать типы без JSDoc комментариев
- ❌ Не смешивать типы разных доменов в одном файле
- ❌ Не использовать `any` вместо конкретных типов

---

## Организация файлов

### Структура проекта

```
src/
  components/          # Переиспользуемые компоненты
    ui/                # UI компоненты (Button, Input, etc.)
    [Feature]/         # Компоненты конкретной функциональности
  hooks/               # Переиспользуемые хуки
    api/               # API хуки
    forms/             # Хуки форм
    async/             # Асинхронные хуки
    utils/             # Утилиты для хуков
  pages/               # Страницы приложения
    [PageName]/        # Страница с подкомпонентами и хуками
  services/            # Сервисы (API клиенты)
    api/               # API сервисы
  types/               # TypeScript типы
  utils/               # Утилиты
  constants/           # Константы
  context/            # React контексты
```

### Barrel Exports

Все директории с публичными API должны иметь `index.ts` для barrel exports:

```typescript
/**
 * [Directory] - centralized exports
 * 
 * @example
 * ```tsx
 * import { export1, export2 } from '@/[directory]'
 * ```
 */

export { export1 } from './file1'
export { export2 } from './file2'
export type { Type1 } from './file1'
```

### Что делать

- ✅ Следовать стандартной структуре директорий
- ✅ Создавать barrel exports для упрощения импортов
- ✅ Группировать связанные файлы в директориях
- ✅ Использовать понятные имена файлов и директорий
- ✅ Разделять логику по доменам

### Чего избегать

- ❌ Не создавать плоскую структуру файлов
- ❌ Не смешивать компоненты разных уровней абстракции
- ❌ Не забывать создавать barrel exports
- ❌ Не использовать неочевидные имена файлов
- ❌ Не создавать слишком глубокую вложенность (>3 уровней)

---

## Общие принципы

### Документация

- ✅ Все публичные API должны иметь JSDoc комментарии
- ✅ JSDoc должен включать описание, параметры, возвращаемые значения и примеры
- ✅ Использовать примеры кода в JSDoc для лучшего понимания

### Типизация

- ✅ Использовать строгие типы TypeScript
- ✅ Избегать `any` типов
- ✅ Использовать branded types для ID
- ✅ Типизировать все параметры и возвращаемые значения

### Консистентность

- ✅ Следовать установленным паттернам
- ✅ Использовать существующие утилиты и хуки
- ✅ Не создавать дублирующий функционал
- ✅ Использовать единый стиль кода

### ИИ-дружелюбность

- ✅ Явные паттерны вместо имплицитных
- ✅ Полная типизация всех публичных API
- ✅ Комплексные JSDoc с примерами
- ✅ Консистентная структура файлов
- ✅ Barrel exports для упрощения импортов
- ✅ Четкое разделение ответственности

---

## Полезные ссылки

- [API Hooks Pattern](./hooks/api/README.md) - паттерн для API хуков
- [Pages Structure](./pages/STRUCTURE.md) - структура страниц
- [Types Organization](./types/index.ts) - организация типов

---

**Последнее обновление:** 2024

