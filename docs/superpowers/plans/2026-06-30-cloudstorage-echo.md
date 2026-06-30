# CloudStorage Echo (Крок B) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Запустити мінімальний Telegram Mini App (скелет `reactjs-template`), який зберігає/читає одне текстове значення через Telegram CloudStorage (SDK v3), щоб довести, що CloudStorage працює — до порту шифрування.

**Architecture:** Беремо `reference/reactjs-template` як скелет (вже на `@tma.js/sdk-react` v3), копіюємо в корінь проєкту, прибираємо TON Connect і демо-сторінки. Додаємо тонку промісну обгортку `src/storage/cloudStorage.ts` над CloudStorage SDK v3 і один екран `EchoPage`, що працює тільки через цю обгортку. Без шифрування, без менеджерів-контекстів.

**Tech Stack:** React 18 · `@tma.js/sdk-react` v3 · `@telegram-apps/telegram-ui` · Vite 6 · TypeScript · pnpm · GitHub Pages (`gh-pages`).

## Global Constraints

- **Менеджер пакетів:** pnpm (у шаблоні є `pnpm-lock.yaml`).
- **SDK:** `@tma.js/sdk-react` v3 — промісне API, сигнали (`useSignal`, `miniApp`, `backButton`, `viewport`, `themeParams`). НЕ використовувати сирий `window.Telegram.WebApp.*`.
- **UI-кіт:** `@telegram-apps/telegram-ui` (стилі імпортуються першими в `index.tsx`).
- **Поза скоупом:** шифрування (PBKDF2/AES/KCV), менеджери-контексти, кілька ключів / CRUD, біометрія, міграції. YAGNI.
- **UI звертається до CloudStorage тільки через `src/storage/cloudStorage.ts`** — жодних прямих `cloudStorage` / `window.Telegram` у компонентах.
- **Без тест-фреймворку** на цьому кроці. Цикл перевірки: `tsc --noEmit`, `pnpm run lint`, `pnpm run dev` (smoke), `pnpm run build`, і ручне приймання в реальному Telegram.
- **Дії в @BotFather та git push/публікацію** виконує користувач або агент лише з явного погодження.

## File Structure

| Файл | Відповідальність | Дія |
|------|------------------|-----|
| `package.json` | залежності, скрипти, `homepage` | копія шаблону − `@tonconnect/ui-react`, оновити `homepage` |
| `vite.config.ts` | конфіг Vite, `base` під Pages | копія шаблону, `base: '/tg-app-live/'` |
| `tsconfig.json`, `tsconfig.node.json`, `index.html`, `eslint.config.js`, `.eslintrc.cjs` | конфіги | копія шаблону |
| `src/index.tsx`, `src/init.ts`, `src/mockEnv.ts`, `src/index.css` | bootstrap + init SDK | копія шаблону (без змін) |
| `src/components/App.tsx`, `Page.tsx`, `EnvUnsupported.tsx`, `ErrorBoundary.tsx` | тема, роутер, обгортки | копія шаблону (без змін) |
| `src/components/Root.tsx` | провайдери | копія − `TonConnectUIProvider` |
| `src/navigation/routes.tsx` | роути | переписати: єдиний роут `/` → `EchoPage` |
| `src/storage/cloudStorage.ts` | **обгортка CloudStorage SDK v3** | **новий** |
| `src/pages/EchoPage.tsx` | **ехо-екран** | **новий** |

**Видаляємо з шаблону:** `src/pages/IndexPage/`, `InitDataPage.tsx`, `ThemeParamsPage.tsx`, `LaunchParamsPage.tsx`, `TONConnectPage/`; `src/components/DisplayData/`, `RGB/`, `Link/`; `public/tonconnect-manifest.json`. `src/helpers/publicUrl.ts` — перевірити використання (Task 1, Step 4) і видалити лише якщо ніде не імпортується.

---

## Task 1: Скелет проєкту (копіювання шаблону + прибирання TON Connect)

**Files:**
- Create (копіюванням): усі файли з `reference/reactjs-template/` у корінь, крім `node_modules`, `.git`, `pnpm-lock.yaml` (lock скопіювати теж), `README.md`, `CLAUDE.md`, `LICENSE`, `.github/`.
- Modify: `package.json` (прибрати `@tonconnect/ui-react`), `src/components/Root.tsx`, `src/navigation/routes.tsx`
- Delete: демо-сторінки/компоненти TON Connect (список вище)

**Interfaces:**
- Consumes: нічого (перший таск).
- Produces: робочий скелет, який стартує `pnpm run dev`; компонент `Root` без TON Connect; порожній/тимчасовий роут `/`.

- [ ] **Step 1: Скопіювати шаблон у корінь проєкту**

```bash
cd /Users/oleksandrsecond/IdeaProjects/tg-app-live
# Копіюємо вміст шаблону (включно зі схованими файлами), крім git/node_modules
rsync -a --exclude='.git' --exclude='node_modules' reference/reactjs-template/ ./
```

Очікувано: у корені з'явились `src/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json`, `pnpm-lock.yaml`, `public/`, `eslint.config.js`, `.eslintrc.cjs`.

- [ ] **Step 2: Прибрати залежність TON Connect із `package.json`**

Видалити рядок з `dependencies`:
```json
    "@tonconnect/ui-react": "^2.2.0",
```

- [ ] **Step 3: Переписати `src/components/Root.tsx` без TON Connect**

```tsx
import { App } from '@/components/App.tsx';
import { ErrorBoundary } from '@/components/ErrorBoundary.tsx';

function ErrorBoundaryError({ error }: { error: unknown }) {
  return (
    <div>
      <p>An unhandled error occurred:</p>
      <blockquote>
        <code>
          {error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error)}
        </code>
      </blockquote>
    </div>
  );
}

export function Root() {
  return (
    <ErrorBoundary fallback={ErrorBoundaryError}>
      <App/>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 4: Видалити демо-сторінки, компоненти й TON Connect manifest**

```bash
rm -rf src/pages/IndexPage src/pages/TONConnectPage
rm -f src/pages/InitDataPage.tsx src/pages/ThemeParamsPage.tsx src/pages/LaunchParamsPage.tsx
rm -rf src/components/DisplayData src/components/RGB src/components/Link
rm -f public/tonconnect-manifest.json
# Перевірити, чи publicUrl ще використовується; якщо ні — видалити:
grep -rn "publicUrl" src/ || rm -f src/helpers/publicUrl.ts
```

Очікувано: `grep` або показує місця використання (тоді `publicUrl.ts` лишаємо), або нічого (тоді файл видалено).

- [ ] **Step 5: Тимчасово замінити `src/navigation/routes.tsx` на заглушку**

(Повноцінний роут на `EchoPage` додамо в Task 3. Зараз — щоб скелет компілювався без видалених сторінок.)

```tsx
import type { ComponentType } from 'react';
import { Page } from '@/components/Page.tsx';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
}

function PlaceholderPage() {
  return <Page back={false}>tg-app-live: skeleton OK</Page>;
}

export const routes: Route[] = [
  { path: '/', Component: PlaceholderPage },
];
```

> Примітка: `src/components/App.tsx` рендерить `routes` і має fallback-роут `<Route path="*" element={<Navigate to="/"/>}/>` — змінювати не треба, бо `icon` у `Route` шаблону опціональний.

- [ ] **Step 6: Встановити залежності**

```bash
pnpm install
```
Очікувано: встановлення без помилок; `@tonconnect/*` відсутній у дереві.

- [ ] **Step 7: Typecheck + lint**

```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Очікувано: обидві команди завершуються без помилок (немає посилань на видалені TON Connect / демо-файли).

- [ ] **Step 8: Smoke dev-сервера**

```bash
pnpm run dev
```
Очікувано: Vite стартує, друкує локальний URL, без помилок компіляції. Зупинити (Ctrl+C) після підтвердження.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold skeleton from reactjs-template, remove TON Connect"
```

---

## Task 2: Обгортка CloudStorage (`src/storage/cloudStorage.ts`)

**Files:**
- Create: `src/storage/cloudStorage.ts`

**Interfaces:**
- Consumes: `cloudStorage` з `@tma.js/sdk-react`.
- Produces:
  - `setItem(key: string, value: string): Promise<void>`
  - `getItem(key: string): Promise<string>` — `''` якщо ключа немає
  - `getKeys(): Promise<string[]>`
  - `deleteItem(key: string): Promise<void>`
  - `isSupported(): boolean`

- [ ] **Step 1: Звірити фактичне CloudStorage API SDK v3 з типами в `node_modules`**

(Це головна перевірка ризику кроку B — робимо її ДО написання обгортки.)

```bash
# Знайти експорт cloudStorage та сигнатури методів
grep -rn "cloudStorage\|CloudStorage" node_modules/@tma.js/sdk-react/dist/dts/ 2>/dev/null | grep -i "setItem\|getItem\|getKeys\|deleteItem\|removeItem" | head -30
# За потреби — переглянути тип повністю:
find node_modules/@tma.js -path '*cloud*' -name '*.d.ts' | head
```

Очікувано (типова форма SDK v3, ПІДТВЕРДИТИ за виводом):
- `cloudStorage.setItem(key, value)` → `Promise<void>`
- `cloudStorage.getItem(key)` → `Promise<string>` (одиничний ключ; `''` для відсутнього)
- `cloudStorage.getKeys()` → `Promise<string[]>`
- `cloudStorage.deleteItem(key)` → `Promise<void>`
- перевірка підтримки: `cloudStorage.setItem.isAvailable()`

> Якщо назви/форми відрізняються (напр. `removeItem` замість `deleteItem`, або пакет називається `@telegram-apps/sdk-react`) — підлаштувати код у Step 2 під фактичні типи. Не вгадувати.

- [ ] **Step 2: Написати обгортку**

```ts
// src/storage/cloudStorage.ts
import { cloudStorage } from '@tma.js/sdk-react';

/**
 * Тонка промісна обгортка над Telegram CloudStorage (SDK v3).
 * UI має звертатися до CloudStorage ТІЛЬКИ через ці функції.
 * Жодних прямих викликів cloudStorage / window.Telegram у компонентах.
 */

/** Чи доступний CloudStorage у поточному оточенні (Telegram-клієнт потрібної версії). */
export function isSupported(): boolean {
  return cloudStorage.setItem.isAvailable();
}

/** Зберегти значення за ключем. */
export async function setItem(key: string, value: string): Promise<void> {
  await cloudStorage.setItem(key, value);
}

/** Прочитати значення за ключем. Повертає '' якщо ключа немає. */
export async function getItem(key: string): Promise<string> {
  return cloudStorage.getItem(key);
}

/** Список усіх ключів у CloudStorage. */
export async function getKeys(): Promise<string[]> {
  return cloudStorage.getKeys();
}

/** Видалити значення за ключем. */
export async function deleteItem(key: string): Promise<void> {
  await cloudStorage.deleteItem(key);
}
```

> Якщо Step 1 показав, що `cloudStorage` треба монтувати або що метод інший — внести точкові правки тут відповідно до фактичних типів.

- [ ] **Step 3: Typecheck**

```bash
pnpm exec tsc --noEmit
```
Очікувано: без помилок. Якщо TS скаржиться на сигнатуру методу — повернутися до Step 1/2 і вирівняти під фактичний тип.

- [ ] **Step 4: Lint**

```bash
pnpm run lint
```
Очікувано: без помилок/ворнінгів.

- [ ] **Step 5: Commit**

```bash
git add src/storage/cloudStorage.ts
git commit -m "feat: add thin CloudStorage wrapper over SDK v3"
```

---

## Task 3: Ехо-екран (`src/pages/EchoPage.tsx`) + роут

**Files:**
- Create: `src/pages/EchoPage.tsx`
- Modify: `src/navigation/routes.tsx`

**Interfaces:**
- Consumes: `setItem`, `getItem`, `isSupported` з `@/storage/cloudStorage.ts`; `Page` з `@/components/Page.tsx`; `@telegram-apps/telegram-ui`.
- Produces: компонент `EchoPage`, доступний на роуті `/`.

- [ ] **Step 1: Написати `src/pages/EchoPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  List,
  Section,
  Placeholder,
} from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page.tsx';
import { getItem, setItem, isSupported } from '@/storage/cloudStorage.ts';

const ECHO_KEY = 'echo';

type Status = 'idle' | 'saving' | 'saved' | 'loading' | 'error';

export function EchoPage() {
  const [draft, setDraft] = useState('');
  const [stored, setStored] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  // Автозавантаження при монтуванні — доказ персистентності між сесіями:
  // зберіг → закрив Mini App → відкрив → значення з'явилось без "Прочитати".
  useEffect(() => {
    if (!isSupported()) {
      setStatus('error');
      setError('CloudStorage недоступний у цьому оточенні (потрібен Telegram).');
      return;
    }
    setStatus('loading');
    getItem(ECHO_KEY)
      .then((value) => {
        setStored(value);
        setStatus('idle');
      })
      .catch((e: unknown) => {
        setStatus('error');
        setError(e instanceof Error ? e.message : String(e));
      });
  }, []);

  async function handleSave() {
    setStatus('saving');
    setError('');
    try {
      await setItem(ECHO_KEY, draft);
      setStatus('saved');
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleRead() {
    setStatus('loading');
    setError('');
    try {
      const value = await getItem(ECHO_KEY);
      setStored(value);
      setStatus('idle');
    } catch (e: unknown) {
      setStatus('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Page back={false}>
      <List>
        <Section
          header="Перевірка Telegram CloudStorage"
          footer="Зберегти → закрити Mini App → відкрити знову: значення має підвантажитись автоматично."
        >
          <Input
            header="Значення"
            placeholder="Введи будь-який текст"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
            <Button size="m" stretched onClick={handleSave} loading={status === 'saving'}>
              Зберегти
            </Button>
            <Button size="m" mode="outline" stretched onClick={handleRead} loading={status === 'loading'}>
              Прочитати
            </Button>
          </div>
        </Section>

        <Section header="Результат">
          <Placeholder
            header={stored === null ? 'Ще не зчитано' : (stored === '' ? 'Порожньо' : 'Збережене значення')}
            description={stored ? stored : (status === 'error' ? error : 'Натисни "Прочитати" або перезапусти Mini App')}
          />
        </Section>
      </List>
    </Page>
  );
}
```

> Примітка: точні пропси компонентів `@telegram-apps/telegram-ui` (`Input.onChange`, `Button.mode`/`size`/`stretched`, `Placeholder`) звірити з типами в `node_modules/@telegram-apps/telegram-ui` при першій помилці typecheck; підлаштувати за фактом, не змінюючи логіку.

- [ ] **Step 2: Підключити роут у `src/navigation/routes.tsx`**

```tsx
import type { ComponentType } from 'react';

import { EchoPage } from '@/pages/EchoPage.tsx';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
}

export const routes: Route[] = [
  { path: '/', Component: EchoPage },
];
```

- [ ] **Step 3: Typecheck**

```bash
pnpm exec tsc --noEmit
```
Очікувано: без помилок. Помилки про пропси UI-кіта — звірити з типами й підлаштувати (див. примітку Step 1).

- [ ] **Step 4: Lint**

```bash
pnpm run lint
```
Очікувано: без помилок.

- [ ] **Step 5: Smoke dev-сервера**

```bash
pnpm run dev
```
Очікувано: екран рендериться у браузері під mockEnv (поле, дві кнопки, секція результату). У браузері без Telegram очікувано покаже помилку «CloudStorage недоступний» — це коректна поведінка обгортки, транспорт перевіримо в Telegram (Task 4). Зупинити після перевірки.

- [ ] **Step 6: Commit**

```bash
git add src/pages/EchoPage.tsx src/navigation/routes.tsx
git commit -m "feat: add CloudStorage echo screen on root route"
```

---

## Task 4: Деплой-конфіг + збірка + приймання в Telegram

**Files:**
- Modify: `vite.config.ts` (поле `base`), `package.json` (поле `homepage`)

**Interfaces:**
- Consumes: усе попереднє.
- Produces: збірку в `dist/`, придатну для GitHub Pages; задеплоєний Mini App.

- [ ] **Step 1: Виставити `base` у `vite.config.ts`**

Замінити:
```ts
  base: '/reactjs-template/',
```
на:
```ts
  base: '/tg-app-live/',
```

- [ ] **Step 2: Виставити `homepage` у `package.json`**

Замінити значення `homepage` на (підставити фактичний GitHub-username користувача — уточнити перед виконанням):
```json
  "homepage": "https://<github-username>.github.io/tg-app-live",
```

> Якщо ім'я репозиторію на GitHub інше за `tg-app-live`, узгодити `base` і `homepage` під фактичне ім'я.

- [ ] **Step 3: Продакшн-збірка**

```bash
pnpm run build
```
Очікувано: `tsc --noEmit && vite build` проходить без помилок; з'являється тека `dist/`.

- [ ] **Step 4: Локальний preview збірки**

```bash
pnpm run preview
```
Очікувано: Vite preview віддає зібраний застосунок без помилок у консолі. Зупинити після перевірки.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts package.json
git commit -m "chore: configure base/homepage for GitHub Pages deploy"
```

- [ ] **Step 6: Деплой на GitHub Pages (узгодити перед виконанням)**

> Потребує налаштованого GitHub-репозиторію `tg-app-live` з origin. Push/публікацію узгодити з користувачем перед виконанням.

```bash
pnpm run deploy
```
Очікувано: `gh-pages` публікує `dist/` у гілку `gh-pages`; GitHub Pages віддає застосунок за `homepage`-URL.

- [ ] **Step 7: Прив'язати Mini App у @BotFather (виконує користувач)**

Інструкція користувачу:
1. @BotFather → створити бота (`/newbot`), якщо ще немає.
2. `/newapp` (або `/myapps` → обрати бота → Bot Settings → Menu Button) → вказати URL Pages: `https://<github-username>.github.io/tg-app-live/`.
3. Відкрити Mini App через бота на **реальному пристрої/клієнті** Telegram.

- [ ] **Step 8: Ручне приймання (Definition of Done)**

У реальному Telegram-клієнті:
1. **Round-trip:** ввести текст → «Зберегти» (статус «saved») → «Прочитати» → секція «Результат» показує те саме значення.
2. **Персистентність:** після збереження **повністю закрити** Mini App → відкрити знову → значення підвантажилось автоматично (через `useEffect`), без натискання «Прочитати».

Очікувано: обидва сценарії проходять. Якщо так — крок B завершено, головний ризик (CloudStorage через SDK v3) знято.

---

## Self-Review

**1. Spec coverage:**
- Скелет + прибирання TON Connect → Task 1 ✓
- Обгортка `cloudStorage.ts` (4 функції, порт SDK v3) → Task 2 ✓
- Звірка фактичного API SDK v3 з типами (головний ризик) → Task 2 Step 1 ✓
- Ехо-екран (поле, Зберегти, Прочитати, автозавантаження) → Task 3 ✓
- UI лише через обгортку → Task 3 (імпорти тільки з `@/storage/cloudStorage`) ✓
- Деплой (vite base, homepage, gh-pages) → Task 4 ✓
- @BotFather прив'язка (користувач) → Task 4 Step 7 ✓
- DoD: install/dev/typecheck/build/round-trip/persistence/TON Connect прибраний → Tasks 1–4 ✓
- Поза скоупом (крипта, менеджери, CRUD, біометрія, міграції) → не торкаємось ✓

**2. Placeholder scan:** `<github-username>` — навмисний параметр деплою, явно позначений «уточнити перед виконанням», не код-плейсхолдер. Решта кроків містять конкретний код/команди. ✓

**3. Type consistency:** імена функцій обгортки (`setItem`, `getItem`, `getKeys`, `deleteItem`, `isSupported`) однакові в Task 2 (визначення) і Task 3 (споживання). Ключ `ECHO_KEY = 'echo'` єдиний. ✓

**Відкриті точки, що залежать від фактичних типів (закладено в кроки, не плейсхолдери):**
- Точна форма CloudStorage API SDK v3 → Task 2 Step 1 звіряє й підлаштовує.
- Пропси `@telegram-apps/telegram-ui` → Task 3 Step 1 примітка звіряє при першій помилці typecheck.
