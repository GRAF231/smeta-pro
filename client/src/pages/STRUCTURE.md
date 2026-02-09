# Стандартная структура страниц

## Обзор

Этот документ описывает стандартную структуру организации страниц в приложении для обеспечения консистентности и упрощения навигации.

## Стандартная структура

Все страницы должны следовать следующей структуре:

```
pages/
  PageName/
    - index.tsx          # Основной компонент страницы
    - components/        # Подкомпоненты (если есть)
      - Component1.tsx
      - Component2.tsx
    - hooks/            # Специфичные хуки страницы (если есть)
      - useCustomHook.ts
    - utils/            # Утилиты страницы (если есть)
      - helpers.ts
```

## Примеры

### Пример 1: Страница с подкомпонентами и хуками

```
pages/
  EstimatePage/
    - index.tsx
    - components/
      - EstimateActions.tsx
      - EstimateHeader.tsx
      - EstimateTotals.tsx
    - hooks/
      - useEstimateHandlers.ts
      - useEstimatePageState.ts
      - useItemHandlers.ts
      - useSectionHandlers.ts
      - useViewHandlers.ts
    - utils/
      - calculations.ts
    - SectionCard.tsx
    - VersionModal.tsx
    - ViewTabs.tsx
```

### Пример 2: Простая страница без подкомпонентов

```
pages/
  Login/
    - index.tsx
```

## Текущее состояние

### Страницы с правильной структурой ✅

- `EstimatePage/` - имеет components/, hooks/, utils/
- `ProjectEditor/` - имеет components/, hooks/
- `MaterialsPage/` - имеет components/, hooks/
- `AiEstimateGenerator/` - имеет components/, hooks/
- `Home/` - имеет components/

### Страницы, требующие реорганизации

Следующие страницы находятся непосредственно в `pages/` и должны быть перемещены в отдельные директории:

- `ActPage.tsx` → `pages/ActPage/index.tsx`
- `ActsPage.tsx` → `pages/ActsPage/index.tsx`
- `Dashboard.tsx` → `pages/Dashboard/index.tsx`
- `Login.tsx` → `pages/Login/index.tsx`
- `Register.tsx` → `pages/Register/index.tsx`
- `ProjectForm.tsx` → `pages/ProjectForm/index.tsx`
- `CustomerView.tsx` → `pages/CustomerView/index.tsx`
- `MasterView.tsx` → `pages/MasterView/index.tsx`
- `PublicView.tsx` → `pages/PublicView/index.tsx` (уже имеет документацию)

## Рекомендации по миграции

При перемещении страниц:

1. **Создать директорию** с именем страницы
2. **Переместить файл** в `index.tsx` внутри директории
3. **Обновить импорты** во всех файлах, которые используют эту страницу
4. **Обновить роутинг** в `App.tsx` или файле роутинга
5. **Проверить** что все импорты работают корректно

## Импорты

После стандартизации структуры, импорты страниц будут выглядеть так:

```typescript
// Вместо
import Dashboard from './pages/Dashboard'

// Использовать
import Dashboard from './pages/Dashboard'
// или
import { Dashboard } from './pages/Dashboard' // если есть barrel export
```

## Barrel Exports (опционально)

Для упрощения импортов можно создать `index.ts` в каждой директории страницы:

```typescript
// pages/Dashboard/index.ts
export { default } from './Dashboard'
```

Однако это не обязательно, так как `index.tsx` уже служит точкой входа.

## Примечания

- Не все страницы требуют подкомпонентов или хуков
- Структура должна быть гибкой и соответствовать сложности страницы
- Простые страницы могут состоять только из `index.tsx`
- Сложные страницы должны разбиваться на логические компоненты и хуки

