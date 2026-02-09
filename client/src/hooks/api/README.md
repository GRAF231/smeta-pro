# API Hooks Pattern

## Обзор

Все API хуки следуют единому паттерну для обеспечения консистентности и упрощения использования. Этот документ описывает стандартный подход к созданию и использованию API хуков.

## Стандартный паттерн

### Структура хука

Все API хуки должны возвращать следующий набор значений:

```typescript
{
  // Данные (может быть массив, объект или null)
  data: T | null
  
  // Состояние загрузки
  isLoading: boolean
  
  // Сообщение об ошибке (пустая строка если ошибок нет)
  error: string
  
  // Функция выполнения операции
  execute: (...args: unknown[]) => Promise<T | undefined>
  
  // Функция сброса состояния
  reset: () => void
  
  // Дополнительные операции (загрузка, создание, обновление, удаление и т.д.)
  // ...
}
```

### Обработка ошибок

Все хуки используют единый подход к обработке ошибок через `getErrorMessage` из `utils/errors`:

```typescript
import { getErrorMessage } from '../../utils/errors'

try {
  const res = await api.someOperation()
  return res.data
} catch (err) {
  setError(getErrorMessage(err, 'Сообщение по умолчанию'))
  throw err // Опционально, если нужно пробросить ошибку дальше
}
```

### Управление состоянием загрузки

Все операции должны устанавливать `isLoading`:

```typescript
const loadData = useCallback(async () => {
  setIsLoading(true)
  setError('')
  try {
    const res = await api.getData()
    setData(res.data)
  } catch (err) {
    setError(getErrorMessage(err, 'Ошибка загрузки'))
  } finally {
    setIsLoading(false)
  }
}, [])
```

## Примеры использования

### Базовый хук для загрузки данных

```typescript
export function useMyData(id: string | undefined) {
  const [data, setData] = useState<MyDataType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const loadData = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError('')
    try {
      const res = await myApi.get(id)
      setData(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки данных'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  const reset = useCallback(() => {
    setData(null)
    setError('')
  }, [])

  return {
    data,
    isLoading,
    error,
    loadData,
    reset,
    setData,
    setError,
  }
}
```

### Хук с операциями CRUD

```typescript
export function useMyResources(projectId: string | undefined) {
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const loadResources = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await api.getAll(projectId)
      setResources(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка загрузки'))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const createResource = useCallback(async (data: CreateData) => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await api.create(projectId, data)
      setResources(prev => [...prev, res.data])
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, 'Ошибка создания'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  // ... другие операции

  return {
    resources: data,
    isLoading,
    error,
    loadResources,
    createResource,
    // ...
    setError,
  }
}
```

## Использование в компонентах

```typescript
function MyComponent({ projectId }: { projectId: string }) {
  const { resources, isLoading, error, loadResources, createResource } = useMyResources(projectId)

  useEffect(() => {
    loadResources()
  }, [projectId])

  if (isLoading) return <Spinner />
  if (error) return <ErrorAlert message={error} />

  return (
    <div>
      {resources.map(resource => (
        <ResourceItem key={resource.id} resource={resource} />
      ))}
    </div>
  )
}
```

## Принципы

1. **Консистентность**: Все хуки следуют одному паттерну
2. **Обработка ошибок**: Единый подход через `getErrorMessage`
3. **Состояние загрузки**: Всегда управляется через `isLoading`
4. **Типизация**: Полная типизация всех параметров и возвращаемых значений
5. **Документация**: JSDoc комментарии с примерами для всех публичных API

## Существующие хуки

- `useProjects` - управление проектами
- `useMaterials` - управление материалами
- `useActs` - управление актами выполненных работ
- `useEstimateViews` - управление представлениями смет
- `useVersions` - управление версиями смет

Все эти хуки следуют описанному паттерну и могут служить примерами при создании новых хуков.

