# Архитектура проекта СметаПро

## Обзор

СметаПро — это веб-приложение для создания и управления сметами на ремонт. Проект использует React с TypeScript на фронтенде и Node.js с Express на бэкенде.

## Структура проекта

```
client/
├── src/
│   ├── components/          # Переиспользуемые компоненты
│   │   ├── ui/              # Базовые UI компоненты
│   │   ├── tables/          # Компоненты таблиц
│   │   ├── ActGenerator/    # Генератор актов
│   │   ├── MaterialsPdfGenerator/  # Генератор КП
│   │   ├── Layout.tsx        # Основной layout
│   │   ├── ProtectedRoute.tsx  # Защита маршрутов
│   │   └── EstimateTable.tsx    # Таблица сметы
│   ├── pages/               # Страницы приложения
│   │   ├── Home/            # Главная страница (разбита на компоненты)
│   │   ├── Dashboard.tsx    # Дашборд проектов
│   │   ├── EstimatePage/    # Страница редактирования сметы
│   │   ├── MaterialsPage/   # Страница материалов
│   │   └── ...
│   ├── hooks/               # Кастомные хуки
│   │   ├── api/             # Хуки для работы с API
│   │   ├── async/           # Хуки для асинхронных операций
│   │   └── forms/           # Хуки для форм
│   ├── services/            # Сервисы
│   │   ├── api/             # API клиенты
│   │   └── errors/          # Обработка ошибок
│   ├── types/               # TypeScript типы
│   ├── utils/               # Утилиты
│   ├── constants/           # Константы
│   ├── context/             # React контексты
│   └── App.tsx              # Корневой компонент
```

## Паттерны и принципы

### 1. Работа с API через хуки

Все взаимодействие с API происходит через кастомные хуки в `hooks/api/`. Это обеспечивает:
- Единообразную обработку ошибок
- Управление состоянием загрузки
- Переиспользуемую логику

**Пример:**
```tsx
import { useProjects } from '../hooks/api/useProjects'

function Dashboard() {
  const { projects, isLoading, error, loadProjects, deleteProject } = useProjects()
  
  useEffect(() => {
    loadProjects()
  }, [loadProjects])
  
  // ...
}
```

**Паттерн хука:**
```tsx
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await projectsApi.getAll()
      setProjects(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки проектов'))
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  return { projects, isLoading, error, loadProjects, ... }
}
```

### 2. Branded Types для ID

Для типобезопасности используются branded types для всех ID:

```tsx
// types/common.ts
export type ProjectId = string & { readonly __brand: 'ProjectId' }
export type ViewId = string & { readonly __brand: 'ViewId' }
// ...

// Конвертация на границах
export function asProjectId(id: string): ProjectId {
  return id as ProjectId
}
```

**Использование:**
```tsx
import { asProjectId } from '../types'

// В компонентах с useParams
const params = useParams<{ id: string }>()
const projectId = asProjectId(params.id)

// В API функциях
function getOne(id: ProjectId) {
  return api.get(`/projects/${id}`)
}
```

### 3. Универсальный хук useAsync

Для стандартизации асинхронных операций используется `useAsync`:

```tsx
import { useAsync } from '../hooks/async/useAsync'

const { data, isLoading, error, execute } = useAsync(
  async (id: string) => {
    const res = await api.get(`/users/${id}`)
    return res.data
  },
  {
    defaultErrorMessage: 'Ошибка загрузки пользователя',
    onSuccess: (user) => console.log('Загружен:', user),
  }
)

useEffect(() => {
  execute(userId)
}, [userId])
```

### 4. Структура компонентов

#### UI компоненты (`components/ui/`)

Базовые переиспользуемые компоненты:
- `Button` — кнопка с вариантами стилей
- `Input` — поле ввода
- `Select` — выпадающий список
- `Modal` — модальное окно
- `FormField` — обертка для полей формы
- `Spinner` — индикатор загрузки
- `Toast` — уведомления
- И другие...

**Принципы:**
- Все пропсы типизированы через интерфейсы
- Поддержка различных размеров и вариантов
- Консистентная стилизация через TailwindCSS

#### Композиция компонентов

Большие компоненты разбиваются на меньшие:

```
pages/Home.tsx (32 строки)
├── components/HeroSection.tsx
├── components/FeaturesSection.tsx
├── components/HowItWorksSection.tsx
├── components/WorkflowOverview.tsx
└── components/CTASection.tsx
```

### 5. Обработка ошибок

Централизованная обработка ошибок через `ErrorHandler`:

```tsx
import { errorHandler } from '../services/errors'

try {
  await someOperation()
} catch (err) {
  errorHandler.handle(err, 'Описание операции', {
    context: 'additional context'
  })
}
```

**Особенности:**
- Автоматическая обработка API ошибок через interceptor
- Логирование ошибок
- Показ пользователю понятных сообщений
- Обработка 401 ошибок (автоматический logout)

### 6. Типы и интерфейсы

Все типы организованы по доменам в `types/`:

```
types/
├── index.ts          # Реэкспорт всех типов
├── common.ts         # Общие типы (branded IDs)
├── projects.ts       # Типы проектов
├── estimates.ts      # Типы смет
├── materials.ts      # Типы материалов
├── acts.ts           # Типы актов
├── auth.ts           # Типы аутентификации
└── errors.ts         # Типы ошибок
```

**Импорт типов:**
```tsx
// Всегда из types/index.ts
import type { Project, ProjectId, EstimateView } from '../types'
```

### 7. Константы

Все константы вынесены в `constants/`:

- `api.ts` — константы API (URLs, статусы)
- `routes.ts` — маршруты приложения
- `storage.ts` — ключи localStorage
- `ui.ts` — UI константы

### 8. Утилиты

Утилиты в `utils/`:

- `params.ts` — конвертация параметров URL в branded types
- `errors.ts` — обработка ошибок
- `format.ts` — форматирование данных
- `validation.ts` — валидация
- `clipboard.ts` — работа с буфером обмена
- `pdfGenerator.ts` — генерация PDF
- `numberToWords.ts` — числа прописью

## Работа с маршрутизацией

### Защищенные маршруты

```tsx
<Route
  path="dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Публичные представления

Публичные ссылки используют токены:
- `/v/:token` — универсальное представление
- Поддержка паролей для представлений

## Работа с формами

### Паттерн управления формой

```tsx
import { useFormState } from '../hooks/forms/useFormState'

const {
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  setFieldValue,
  reset,
} = useFormState({
  initialValues: { title: '', email: '' },
  validate: (values) => {
    const errors = {}
    if (!values.title) errors.title = 'Обязательное поле'
    return errors
  },
})
```

## Принципы работы с ИИ

При работе с ИИ-ассистентами (например, Cursor AI):

1. **Всегда используйте хуки вместо прямых вызовов API**
   - ❌ `projectsApi.getAll()`
   - ✅ `const { projects, loadProjects } = useProjects()`

2. **Используйте branded types для ID**
   - ❌ `function delete(id: string)`
   - ✅ `function delete(id: ProjectId)`

3. **Разбивайте большие компоненты**
   - Если компонент > 200 строк, разбейте на подкомпоненты

4. **Добавляйте JSDoc комментарии**
   - Описывайте пропсы компонентов
   - Добавляйте примеры использования

5. **Следуйте структуре папок**
   - Компоненты в `components/`
   - Страницы в `pages/`
   - Хуки в `hooks/`
   - Типы в `types/`

6. **Используйте существующие UI компоненты**
   - Не создавайте новые, если есть подходящий в `components/ui/`

7. **Обрабатывайте ошибки централизованно**
   - Используйте `errorHandler` из `services/errors`

## Примеры использования

### Создание нового хука для API

```tsx
// hooks/api/useMaterials.ts
import { useState, useCallback } from 'react'
import { materialsApi } from '../../services/api'
import type { Material, MaterialId } from '../../types'
import { getErrorMessage } from '../../utils/errors'

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const loadMaterials = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await materialsApi.getAll()
      setMaterials(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки материалов'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { materials, isLoading, error, loadMaterials }
}
```

### Создание нового UI компонента

```tsx
// components/ui/Textarea.tsx
import { TextareaHTMLAttributes, forwardRef } from 'react'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Textarea size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether textarea has error state */
  error?: boolean
  /** Error message to display */
  errorMessage?: string
}

/**
 * Reusable textarea component with consistent styling
 * 
 * @example
 * ```tsx
 * <Textarea
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   placeholder="Enter text"
 * />
 * ```
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ size = 'md', error = false, errorMessage, className = '', ...props }, ref) => {
    // Implementation...
  }
)

Textarea.displayName = 'Textarea'
export default Textarea
```

### Создание новой страницы

```tsx
// pages/NewPage.tsx
import { useParams } from 'react-router-dom'
import { PageSpinner } from '../components/ui/Spinner'
import ErrorAlert from '../components/ui/ErrorAlert'
import { useSomeHook } from '../hooks/api/useSomeHook'
import { getProjectIdFromParams } from '../utils/params'

/**
 * NewPage component description
 * 
 * @example
 * Used as a route in App.tsx:
 * ```tsx
 * <Route path="new-page" element={<NewPage />} />
 * ```
 */
export default function NewPage() {
  const params = useParams<{ id: string }>()
  const projectId = getProjectIdFromParams(params)
  
  const { data, isLoading, error } = useSomeHook(projectId)
  
  if (isLoading) return <PageSpinner />
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ErrorAlert message={error} />
      {/* Content */}
    </div>
  )
}
```

## Технологии

- **React 18** — UI библиотека
- **TypeScript** — типизация
- **React Router** — маршрутизация
- **Axios** — HTTP клиент
- **TailwindCSS** — стилизация
- **Vite** — сборщик

## Соглашения

1. **Именование файлов:**
   - Компоненты: `PascalCase.tsx`
   - Хуки: `camelCase.ts` (начинается с `use`)
   - Утилиты: `camelCase.ts`
   - Типы: `camelCase.ts`

2. **Именование компонентов:**
   - Экспортируемые компоненты: `PascalCase`
   - Внутренние компоненты: `camelCase` или `PascalCase`

3. **Импорты:**
   - Типы: `import type { ... }`
   - Компоненты: `import Component from './Component'`
   - Хуки: `import { useHook } from './hooks'`
   - API: `import { api } from './services/api'`

4. **Стилизация:**
   - Используйте TailwindCSS классы
   - Избегайте inline стилей
   - Используйте классы из `index.css` для общих стилей

5. **Обработка ошибок:**
   - Всегда обрабатывайте ошибки
   - Используйте централизованный `errorHandler`
   - Показывайте понятные сообщения пользователю

## Дополнительные ресурсы

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com/)

