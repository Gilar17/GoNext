# Handoff GoNext — текущее состояние

Дата: 2026-08-18  
Источник истины для следующего агента: **этот файл**.  
Более старые `docs/handoff/places-ui.md` и `docs/handoff/gonext-stage-6.md` описывают прошлые сессии (Этапы 4–6) и **устарели** по статусу плана.

## Git

| Параметр | Значение |
|---|---|
| Ветка | `main` |
| Remote | совпадает с `origin/main` |
| Рабочее дерево на момент handoff | чистое (`nothing to commit`) |
| Последний commit | `c2e16b2` — контраст / accent-цвета темы |
| Автор последнего commit | Gilar17 (не этот агент) |

Последние релевантные коммиты на `main`:

1. `c2e16b2` — accent-цвета, контраст primary в тёмной теме, правки экранов и Paper-темы.
2. `8a243ba` — переключатель фонового изображения, AsyncStorage `@gonext/showBackgroundImage`.
3. `74b39fc` — i18next, ru/en, AsyncStorage `@gonext/language`.

---

## 1. Что было сделано в этом агенте

Сессия продолжала полировку MVP (Этап 8), без новой бизнес-логики мест/поездок.

### 1.1. Контраст основного цвета в тёмной теме

Проблема: последний кружок палитры `#334155` в тёмной теме почти сливался с фоном у текста и иконок (`GoNext`, `Current trip`, корзины, шевроны).

Причина: выбранный `primary` использовался напрямую как цвет текста/иконок. На карточке `#3A3744` контраст `#334155` был ~1.12:1. Заливки кнопок с белым текстом читались нормально.

Решение (системное, не точечная замена одного элемента):

- Пользовательский выбранный цвет остаётся `primary` и идёт **только в заливки**.
- Для текста, иконок, outlined-кнопок, Switch, Dialog используется `accent` — тот же оттенок, при необходимости осветлённый/затемнённый до контраста ≥ 4.5:1.
- Палитра из 10 кружков **не менялась**. `#334155` сохранён.
- Обычный информационный текст — `onSurface` / `surfaces.mutedText` / `surfaces.bodyText`, не `primary`.
- Контраст **не** чинился через `opacity`.

### 1.2. Локализация ru/en

Ранее в этой же линии работы (уже в `74b39fc`):

- `i18next` + `react-i18next`;
- словари `src/i18n/locales/ru.json`, `src/i18n/locales/en.json`;
- язык по умолчанию `ru`;
- переключение в Settings без иконки translate;
- ключ AsyncStorage: `@gonext/language`.

### 1.3. Фоновое изображение

Уже в `8a243ba` и текущем `_layout.tsx`:

- настройка «Показывать фоновое изображение»;
- ключ AsyncStorage: `@gonext/showBackgroundImage`;
- картинка `assets/backgrounds/gonext-bg.png` показывается **только в светлой теме и только если настройка включена**.
- В тёмной теме всегда сплошной `surfaces.appBackground` (`#1C1B1F`).

### 1.4. Исправление runtime-ошибки `t`

После правок контраста на главном экране случайно пропал `useTranslation()`, появился `ReferenceError: Property 't' doesn't exist` в `app/index.tsx`.

Исправлено: `const { t } = useTranslation()`, название приложения через `t('app.name')`.  
Упоминание `_layout.tsx` в стеке — это родитель, который рендерит `HomeScreen`, а не отдельный баг layout.

Если Expo всё ещё показывает старый redbox с `title={t('app.name')}` на строке 14 — это застывший бандл. В терминале Expo нажать **`r`**.

---

## 2. Какие файлы были изменены

Актуальное состояние — в commit `c2e16b2` и предшествующих `8a243ba`, `74b39fc`. Ниже — карта по зонам.

### Тема и цвета

- `src/theme/primaryColors.ts` — палитра `PRIMARY_COLORS` (10 HEX), `getForegroundAccent`, `getOnColor`, `contrastRatio`, `mixHex`.
- `src/theme/surfaces.ts` — `getAccentColor`, `getSurfaceColors(..., accent)`, `filterIdle` / `filterIdleText`.
- `src/theme/AppThemeProvider.tsx` — контекст `primary`, `accent`, `showBackgroundImage`, Paper-тема.
- `src/theme/tripButtons.ts` — `useAccentStyles()`: `fill=primary`, `fg=accent`, outline/filled.
- `src/theme/ui.ts` — эталон размеров; `UI.primary` `#6750A4` остаётся константой-эталоном, динамический цвет — из `useAppTheme()`.

### Экраны

- `app/_layout.tsx` — `I18nextProvider`, фон, `PaperProvider`, `Stack key={language}`.
- `app/index.tsx` — бренд `accent`, contained-кнопки с `buttonColor={primary}`.
- `app/settings.tsx` — язык, светлая/тёмная, 10 кружков, фон, Switch `accent`.
- `app/trips/index.tsx`, `app/trips/[id]/index.tsx`
- `app/places/index.tsx`, `app/places/[id]/index.tsx`
- `app/next.tsx`

### Компоненты

- `src/components/FilterToggleButton.tsx` — активный: заливка `primary` + белый текст; неактивный: `filterIdle` + `filterIdleText` (`accent`).
- `src/components/PrimaryButton.tsx`
- `src/components/ScreenScaffold.tsx` — заголовок/иконки `theme.colors.onSurface`, зазор `UI.headerTitleIconGap = 24`.
- `src/components/PlaceForm.tsx`, `TripForm.tsx`, `TripPlaceNotesSection.tsx`

### i18n (коммит `74b39fc`)

- `src/i18n/index.ts`, `src/i18n/i18next.d.ts`
- `src/i18n/locales/ru.json`, `src/i18n/locales/en.json`

Этот handoff-файл: `docs/handoff/current.md` (новый, ещё не в git до коммита пользователем).

---

## 3. Какие функции сейчас работают

Этапы 1–8 `PLAN.md` реализованы в коде.

| Область | Состояние |
|---|---|
| Каркас Expo Router + Paper + SQLite | работает |
| Главный экран и маршруты | `/`, `/places`, `/places/[id]`, `/places/new`, `/places/[id]/edit`, `/trips`, `/trips/[id]`, `/trips/new`, `/trips/[id]/edit`, `/next`, `/settings` |
| Места: список, поиск, фильтры, CRUD, фото, карта | работает |
| Поездки: текущая, маршрут, порядок, visited, заметки, фото посещения, Все/План/Дневник | работает |
| Следующее место | работает (`app/next.tsx`) |
| Карты / навигатор / геолокация (best effort) | работает |
| Настройки: о приложении, язык, тема, 10 цветов, фон, права, версия | работает |
| Офлайн SQLite + локальные фото | работает |
| ru / en | работает |
| Светлая / тёмная тема | работает |
| Выбор primary из 10 цветов | работает |
| Фоновое изображение (только светлая тема) | работает |

Бизнес-правила поездок, которые нельзя ломать (из более ранних сессий):

- одна текущая поездка (`setCurrentTrip` сбрасывает остальные);
- завершённую поездку нельзя сделать текущей (`endDate` строго раньше сегодняшней локальной даты; в день окончания ещё активна);
- даты UI `DD.MM.YYYY`, хранение `YYYY-MM-DD` (`src/utils/dates.ts`);
- «Уже был» нельзя снять, если есть заметки или фото посещения;
- посещённые места нельзя переставлять;
- карта/навигатор только по сохранённому `Place.dd`.

---

## 4. Тема, цвет, язык, фон — как устроено сейчас

### Светлая / тёмная

- Хранение: файл `appearance.json` в `FileSystem.documentDirectory` (`colorScheme`, `primary`).
- Светлая: полупрозрачные белые карточки, опциональный фон-картинка.
- Тёмная: `appBackground #1C1B1F`, карточки `rgba(44,42,52,0.96)` / `rgba(58,55,68,0.94)`, текст `#E6E1E5` / muted `#B0AAB8`. Картинка фона **не** показывается.

### Основной цвет

Палитра (не менять без запроса), последний кружок — проблемный сланец, **сохранён**:

```
#6750A4  #1D4ED8  #0F766E  #15803D  #C2410C
#B91C1C  #BE185D  #4338CA  #B45309  #334155
```

Контракт цветов:

| Имя | Назначение |
|---|---|
| `useAppTheme().primary` | выбранный HEX; **заливки** (contained, поиск, активный фильтр, remove-photo) |
| `useAppTheme().accent` | читаемый акцент на текущем surface; **текст/иконки/outline/Switch/Dialog** |
| `useAccentStyles()` | `fill` = primary, `fg` / `outline` / `label` = accent |
| `paperTheme.colors.primary` | равен `accent` (чтобы Paper TextInput/Dialog/Switch были читаемы) |
| `paperTheme.colors.primaryContainer` | исходный `primary` |
| `onPrimary` / `onPrimaryContainer` | `getOnColor(...)` — белый или `#1C1B1F` |

Для `#334155` в тёмной теме accent ≈ `#9ba2ab` (WCAG ≥ 4.5:1 на `#3A3744`). В светлой accent = `#334155`.

Расчёт WCAG: в тёмной теме **все 10** сырых primary дают < 4.5:1 на карточке; `getForegroundAccent` осветляет foreground. HEX кружков не менялись.

### Локализация

- Словари: `src/i18n/locales/{ru,en}.json`.
- Init: `src/i18n/index.ts`, `useSuspense: false`.
- Смена языка: Settings → `setAppLanguage` → AsyncStorage `@gonext/language`.
- `Stack` в layout имеет `key={language}`, чтобы пересобрать экраны.
- Даты: `getDateLocale` → `ru-RU` / `en-US`.

### Фоновое изображение

- AsyncStorage `@gonext/showBackgroundImage` (`'true'` / `'false'`), по умолчанию показано.
- Условие показа: `colorScheme === 'light' && showBackgroundImage`.
- Switch в Settings использует `accent` как цвет включённого состояния.

---

## 5. Какие проблемы были исправлены

1. Тёмный `#334155` делал нечитаемыми accent-элементы в dark theme — введён `accent` / Paper semantic colors.
2. Неактивные `FilterToggleButton` в тёмной теме — `filterIdle` / `filterIdleText`.
3. Иконки header сливались / были в primary — `onSurface`, зазор title↔icon 24.
4. Заголовки разделов Settings с `opacity: 0.7` заменены на `surfaces.mutedText`.
5. Runtime `ReferenceError: Property 't' doesn't exist` на HomeScreen — возвращён `useTranslation()`.
6. Кратковременный SyntaxError «ColorSchemeName already declared» в `surfaces.ts` — дубликат типа убран, файл сейчас без повторов.

---

## 6. Что ещё может остаться

Не блокеры MVP, не начинать «большой редизайн» без запроса пользователя:

1. **Визуальный проход в Expo Go.** Контраст 10×2 посчитан по WCAG относительно реальных HEX фонов. Интерактивный клик по всем кружкам в светлой и тёмной теме на устройстве агент не закрыл как ручной QA.
2. **Часть подписей всё ещё с `opacity: 0.7 / 0.75`** (карточки поездки/места, notes label, next). Это старый стиль muted-подписей, не костыль для `#334155`. Не трогать без запроса.
3. **Статические стили `UI.primary`** в `tripButtons.ts` / части StyleSheet — фиолетовый эталон. Динамический цвет задаётся inline через `accent` / `primary`. Не «вычищать» без нужды.
4. **ESLint в проекте не настроен** (есть только `npx tsc --noEmit`).
5. **`PLAN.md` не обновлялся**: Этап 8 там всё ещё «заглушка настроек». По факту настройки + i18n + тема уже сделаны.
6. Если после HMR снова redbox со старыми номерами строк — перезагрузить приложение (`r` в Expo), не править `t` повторно: в текущем `app/index.tsx` хук на месте.

---

## 7. Что обязательно не нужно переделывать

- Этапы 1–8: навигация, SQLite-схема, репозитории, фото, карты, логика поездок/мест/next.
- Этап 9 из `PLAN.md` / `PROJECT.md` (PDF, бэкап, синхронизация, совместные поездки, статистика, карта всего маршрута) — **не начинать**, пока пользователь явно не попросит.
- Палитру 10 цветов, размер/расположение кружков, индикатор выбора.
- Замену `#334155` на другой HEX — цвет оставлен сознательно.
- Структуру Settings, размеры текста/карточек, навигацию.
- Архитектуру i18n и ключи словарей без необходимости.
- Схему хранения: `appearance.json`, `@gonext/language`, `@gonext/showBackgroundImage`.
- Правило «фон-картинка только в светлой теме».
- Контракт `primary` = заливка, `accent` = foreground. Не красить обычный текст карточек в `primary`/`accent`.
- Не чинить читаемость через `opacity` у текста и иконок.
- UX мест и поездок из старых handoff (поиск, фильтры, DD одной строкой, камера/гео только в edit места, кнопки поездки из `tripButtons.ts`).

---

## 8. Где проект в PLAN.md

**Этапы 1–8 выполнены.**  
**Этап 9 — сознательно не делаем в MVP.**

Формально это конец MVP-полировки. Документ `PLAN.md` сам по себе не содержит Этапа 10.

---

## 9. Рекомендуемый следующий шаг

Не начинать новую продуктовую фичу из Этапа 9.

Предпочтительно:

1. Прочитать этот handoff и **не** опираться на `places-ui.md` / `gonext-stage-6.md` как на текущий статус плана.
2. На устройстве (Expo Go / Android) быстро проверить: тёмная тема + последний кружок `#334155`; ru/en; тумблер фона в светлой теме.
3. Дальше — только задача пользователя. Кандидаты, если спросят: мелкий UI-polish, обновление текста `PLAN.md` под фактический Этап 8, либо post-MVP из Этапа 9.

---

## 10. Проверки новому агенту перед изменениями

Обязательно:

1. Прочитать этот файл целиком.
2. `git status`, `git log -5 --oneline` — не считать тему/i18n незакоммиченными.
3. `npx tsc --noEmit`.
4. Понять разницу `primary` vs `accent` vs `paperTheme.colors.primary` **до** любых правок цвета.
5. Если правите UI цвета — проверить **оба** режима и несколько primary, особенно `#334155` в dark.
6. Если правите тексты — править **оба** словаря `ru.json` и `en.json`.
7. Не менять SQLite-схему и бизнес-правила поездок без явного запроса.
8. Команды в ответах пользователю — PowerShell; коммиты — только по просьбе, сообщения на русском.
9. Expo: при странном redbox сначала reload (`r`), сверяя номера строк с текущим файлом на диске.

Проект ориентирован на проверку в **Expo Go на реальном Android**.
