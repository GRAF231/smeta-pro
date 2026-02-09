# СметаПро — Frontend

React приложение для создания и управления сметами на ремонт.

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Предпросмотр продакшен сборки
npm run preview
```

## Структура проекта

```
src/
├── components/      # Переиспользуемые компоненты
├── pages/          # Страницы приложения
├── hooks/          # Кастомные хуки
├── services/       # Сервисы (API, ошибки)
├── types/          # TypeScript типы
├── utils/          # Утилиты
├── constants/      # Константы
└── context/        # React контексты
```

Подробнее см. [ARCHITECTURE.md](./ARCHITECTURE.md)

## Примеры использования

### Работа с проектами

```tsx
import { useProjects } from './hooks/api/useProjects'

function MyComponent() {
  const { projects, isLoading, error, loadProjects, createProject, deleteProject } = useProjects()
  
  useEffect(() => {
    loadProjects()
  }, [loadProjects])
  
  const handleCreate = async () => {
    try {
      await createProject({
        title: 'Новый проект',
        googleSheetUrl: 'https://docs.google.com/spreadsheets/...'
      })
      await loadProjects()
    } catch (err) {
      // Ошибка обрабатывается автоматически
    }
  }
  
  if (isLoading) return <Spinner />
  if (error) return <ErrorAlert message={error} />
  
  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.title}</div>
      ))}
    </div>
  )
}
```

### Работа с одним проектом

```tsx
import { useProject } from './hooks/api/useProjects'
import { asProjectId } from './types'

function ProjectPage({ projectId }: { projectId: string }) {
  const { project, isLoading, error, loadProject, syncProject } = useProject(asProjectId(projectId))
  
  useEffect(() => {
    loadProject()
  }, [loadProject])
  
  const handleSync = async () => {
    try {
      await syncProject()
      // Проект автоматически перезагружается после синхронизации
    } catch (err) {
      // Ошибка обрабатывается автоматически
    }
  }
  
  // ...
}
```

### Использование UI компонентов

```tsx
import Button from './components/ui/Button'
import Input from './components/ui/Input'
import Modal from './components/ui/Modal'
import FormField from './components/ui/FormField'

function MyForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState('')
  
  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Открыть форму
      </Button>
      
      <Modal
        title="Создать проект"
        onClose={() => setIsOpen(false)}
        footer={
          <div className="flex gap-2">
            <Button onClick={handleSubmit}>Сохранить</Button>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Отмена</Button>
          </div>
        }
      >
        <FormField label="Название" required error={errors.title}>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.target)}
            placeholder="Введите название"
          />
        </FormField>
      </Modal>
    </>
  )
}
```

### Работа с типами

```tsx
import type { Project, ProjectId, EstimateView } from './types'
import { asProjectId, asViewId } from './types'

// Использование branded types
function deleteProject(id: ProjectId) {
  return api.delete(`/projects/${id}`)
}

// Конвертация на границах (URL params)
function ProjectPage() {
  const params = useParams<{ id: string }>()
  const projectId = asProjectId(params.id)
  
  // Теперь projectId имеет тип ProjectId, а не string
  deleteProject(projectId) // ✅ OK
  deleteProject('some-string') // ❌ Type error
}
```

### Асинхронные операции с useAsync

```tsx
import { useAsync } from './hooks/async/useAsync'

function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error, execute } = useAsync(
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
  }, [userId, execute])
  
  if (isLoading) return <Spinner />
  if (error) return <ErrorAlert message={error} />
  if (!user) return null
  
  return <div>{user.name}</div>
}
```

### Обработка ошибок

```tsx
import { errorHandler } from './services/errors'

try {
  await someOperation()
} catch (err) {
  errorHandler.handle(err, 'Описание операции', {
    context: 'Дополнительный контекст'
  })
}
```

### Работа с формами

```tsx
import { useFormState } from './hooks/forms/useFormState'

function MyForm() {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useFormState({
    initialValues: {
      title: '',
      email: '',
    },
    validate: (values) => {
      const errors: Record<string, string> = {}
      if (!values.title) {
        errors.title = 'Обязательное поле'
      }
      if (!values.email) {
        errors.email = 'Обязательное поле'
      } else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = 'Некорректный email'
      }
      return errors
    },
    onSubmit: async (values) => {
      await api.post('/projects', values)
    },
  })
  
  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Название" required error={touched.title && errors.title}>
        <Input
          name="title"
          value={values.title}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </FormField>
      
      <FormField label="Email" required error={touched.email && errors.email}>
        <Input
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </FormField>
      
      <Button type="submit">Сохранить</Button>
    </form>
  )
}
```

## Доступные хуки

### API хуки (`hooks/api/`)

- `useProjects()` — работа с проектами
- `useProject(projectId)` — работа с одним проектом
- `useEstimateViews(projectId)` — работа с представлениями смет
- `useMaterials()` — работа с материалами
- `useVersions(projectId)` — работа с версиями
- `useActs(projectId)` — работа с актами

### Асинхронные хуки (`hooks/async/`)

- `useAsync(asyncFn, options)` — универсальный хук для асинхронных операций
- `useAsyncVoid(asyncFn, options)` — для операций без возвращаемого значения

### Хуки форм (`hooks/forms/`)

- `useFormState(options)` — управление состоянием формы
- `useFormValidation(values, rules)` — валидация формы
- `useFormSubmit(onSubmit)` — обработка отправки формы

## UI компоненты

Все компоненты находятся в `components/ui/`:

- `Button` — кнопка с вариантами (primary, secondary, danger, ghost)
- `Input` — поле ввода
- `Select` — выпадающий список
- `Modal` — модальное окно
- `FormField` — обертка для полей формы
- `Spinner` — индикатор загрузки
- `Toast` — уведомления
- `ErrorAlert` — отображение ошибок
- `EmptyState` — пустое состояние
- `LoadingState` — состояние загрузки
- `BackButton` — кнопка "Назад"

Подробнее см. JSDoc комментарии в каждом компоненте.

## Типы

Все типы экспортируются из `types/index.ts`:

```tsx
import type {
  Project,
  ProjectId,
  EstimateView,
  ViewId,
  Material,
  MaterialId,
  // ...
} from './types'
```

Branded types для ID:
- `ProjectId`, `ViewId`, `SectionId`, `ItemId`, `MaterialId`, `VersionId`, `ActId`, `UserId`

Конвертация:
```tsx
import { asProjectId, asViewId } from './types'

const projectId = asProjectId('some-id')
```

## Константы

- `constants/api.ts` — константы API
- `constants/routes.ts` — маршруты приложения
- `constants/storage.ts` — ключи localStorage
- `constants/ui.ts` — UI константы

## Утилиты

- `utils/params.ts` — конвертация параметров URL
- `utils/errors.ts` — обработка ошибок
- `utils/format.ts` — форматирование данных
- `utils/validation.ts` — валидация
- `utils/clipboard.ts` — работа с буфером обмена
- `utils/pdfGenerator.ts` — генерация PDF
- `utils/numberToWords.ts` — числа прописью

## Разработка

### Добавление нового компонента

1. Создайте файл в соответствующей папке
2. Добавьте JSDoc комментарии
3. Типизируйте все пропсы
4. Используйте TailwindCSS для стилизации

### Добавление нового хука API

1. Создайте файл в `hooks/api/`
2. Следуйте паттерну существующих хуков
3. Используйте branded types для ID
4. Обрабатывайте ошибки через `getErrorMessage`

### Добавление новой страницы

1. Создайте файл в `pages/`
2. Добавьте маршрут в `App.tsx`
3. Используйте существующие компоненты и хуки
4. Обрабатывайте состояния загрузки и ошибок

## Тестирование

```bash
# Запуск тестов (если настроены)
npm test
```

## Сборка

```bash
# Продакшен сборка
npm run build

# Результат в dist/
```

## Дополнительная документация

- [ARCHITECTURE.md](./ARCHITECTURE.md) — подробная архитектура проекта
- [План улучшений](../.cursor/plans/) — план развития проекта

