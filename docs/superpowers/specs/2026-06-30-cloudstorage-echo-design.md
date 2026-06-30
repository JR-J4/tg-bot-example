# Крок B — Перевірка CloudStorage (ехо-демо)

**Дата:** 2026-06-30
**Статус:** затверджено, готовий до планування реалізації

## Мета

Перший запускальний крок проєкту `tg-app-live` (vault-додаток як Telegram Mini App).
Ціль кроку — **зняти головний технічний ризик плану**: чи коректно працює Telegram
CloudStorage через `@tma.js/sdk-react` v3 — **до того**, як вкладати зусилля в порт
шифрування з TeleOTP.

Це навмисно мінімальний приклад: скелет + один «ехо»-екран, що зберігає й читає
просте текстове значення з CloudStorage **без шифрування**. Менеджери-контексти,
крипта, CRUD сейфа — наступні кроки.

## Зафіксовані рішення (з брейнштормінгу)

1. **Скоуп:** скелет (`reactjs-template`) + ехо-демо. Без шифрування.
2. **Де перевіряємо:** реальний Telegram-клієнт (не лише dev/mockEnv).
3. **HTTPS:** деплой на хостинг — GitHub Pages через `gh-pages` (`pnpm run deploy`).
4. **Критерій успіху:** round-trip **+** персистентність між сесіями.
5. **Структура:** тонка обгортка `src/storage/cloudStorage.ts` над SDK v3; UI лише викликає її.
6. **Підхід:** чистий мінімум — без наперед закладених порожніх провайдерів (YAGNI).

## Архітектура

> Фундамент = `reference/reactjs-template` (вже на `@tma.js/sdk-react` v3:
> сигнали `useSignal`, `miniApp`, `backButton`, `viewport`, `themeParams`).
> Data-логіка TeleOTP (шифрування/StorageManager) — **поза скоупом цього кроку**,
> але обгортка CloudStorage стане її майбутнім фундаментом.

### Структура файлів (ціль)

```
tg-app-live/
├─ index.html               # з шаблону
├─ package.json             # з шаблону, мінус @tonconnect/ui-react; оновити homepage
├─ vite.config.ts           # з шаблону; base → '/tg-app-live/'
├─ tsconfig.json            # з шаблону
└─ src/
   ├─ index.tsx             # bootstrap (без змін)
   ├─ init.ts               # init SDK (без змін)
   ├─ mockEnv.ts            # dev-мок (без змін)
   ├─ index.css             # з шаблону
   ├─ components/
   │   ├─ Root.tsx          # ЗМІНА: прибрати TonConnectUIProvider, лишити ErrorBoundary
   │   ├─ App.tsx           # AppRoot тема + HashRouter (без змін)
   │   ├─ Page.tsx          # back-button обгортка (без змін)
   │   ├─ EnvUnsupported.tsx
   │   └─ ErrorBoundary.tsx
   ├─ storage/
   │   └─ cloudStorage.ts   # НОВИЙ: тонка обгортка над SDK v3 CloudStorage
   ├─ pages/
   │   └─ EchoPage.tsx      # НОВИЙ: ехо-екран (round-trip + персистентність)
   └─ navigation/
       └─ routes.tsx        # ЗМІНА: єдиний роут "/" → EchoPage
```

**Видаляємо з шаблону:** теку `pages/` шаблону (IndexPage, InitDataPage,
ThemeParamsPage, LaunchParamsPage, TONConnectPage), компоненти `DisplayData/`,
`RGB/`, `Link/`, залежність `@tonconnect/ui-react`, `public/tonconnect-manifest.json`.
`helpers/publicUrl.ts` — перевірити використання при реалізації (може бути потрібен
у мок-логіці); видаляти лише якщо ніде не використовується.

**Підсумок змін:** ~2 нові файли, 3 правки (Root, routes, package.json), решта — видалення.

## Компоненти

### `src/storage/cloudStorage.ts` — обгортка (єдина «довговічна» робота)

Порт сирого `window.Telegram.WebApp.CloudStorage.*` (callback-API TeleOTP) на
промісне API SDK v3. Чотири функції:

```ts
import { cloudStorage } from '@tma.js/sdk-react';

export async function setItem(key: string, value: string): Promise<void>;
export async function getItem(key: string): Promise<string>;   // '' якщо ключа немає
export async function getKeys(): Promise<string[]>;
export async function deleteItem(key: string): Promise<void>;
```

Принципи:
- Кожна функція — тонка обгортка над одним методом `cloudStorage.*`. Без зайвої логіки.
- Проміси замість callback'ів (головна відмінність від TeleOTP).
- UI звертається **тільки** через ці функції — жодних прямих `cloudStorage` / `window.Telegram` в компонентах.

> **РИЗИК / перший пункт реалізації.** Точні сигнатури методів SDK v3
> (назви `getItem`/`setItem`, формат повернення, перевірка `isAvailable()`/`isSupported()`,
> точна назва пакета — `@tma.js/sdk-react` vs `@telegram-apps/sdk-react`) **не підтверджені**
> на момент написання (веб-інструменти були недоступні). Перший крок реалізації:
> `pnpm install` → звіритися з фактичними типами у `node_modules/@tma.js/sdk-react`
> → за потреби підправити обгортку. Це і є та сама перевірка API-сумісності, заради
> якої існує крок B — робимо її явною, а не вгадуємо.

### `src/pages/EchoPage.tsx` — ехо-екран

UI на `@telegram-apps/telegram-ui`, у `<Page back={false}>` (коренева сторінка).

Стан:
```ts
const [draft, setDraft]   = useState('');                      // поле вводу
const [stored, setStored] = useState<string | null>(null);     // прочитане з хмари
const [status, setStatus] = useState<'idle'|'saving'|'saved'|'loading'|'error'>('idle');
const [error,  setError]  = useState('');
```

Розкладка (зверху вниз):
1. Заголовок + підпис «Перевірка Telegram CloudStorage».
2. Поле вводу (`Input`), прив'язане до `draft`.
3. Кнопка **«Зберегти»** → `setItem('echo', draft)` → статус `saving`→`saved`.
4. Кнопка **«Прочитати»** → `getItem('echo')` → у `stored`.
5. Блок результату: показ `stored` («Збережене значення: …» / «порожньо»).
6. Рядок статусу/помилки (текст помилки з обгортки при `error`).

Ключовий механізм перевірки персистентності — автозавантаження при монтуванні:
```ts
useEffect(() => {
  getItem('echo').then(setStored).catch(/* status=error */);
}, []);
```
Саме цей `useEffect` доводить персистентність: зберіг → закрив Mini App → відкрив
знову → значення з'явилось **без** натискання «Прочитати».

Деталі:
- Фіксований ключ `'echo'` — кілька ключів не потрібні на цьому етапі.
- `deleteItem` лишається в обгортці як частина повного порту API, але на екрані не використовується.
- Без шифрування — значення летить у CloudStorage як є (ізолюємо транспорт від крипти).

## Обробка помилок

Мінімальна. Якщо метод CloudStorage недоступний (запуск поза Telegram / старий клієнт)
або кидає помилку — обгортка пробрасує її, `EchoPage` показує текст у UI (рядок статусу).
Помилки **не ковтаємо мовчки**. Повноцінну обробку додамо разом зі StorageManager пізніше.

## Деплой

GitHub Pages через `gh-pages` (уже в шаблоні):
1. `package.json` → `homepage`: `https://<github-username>.github.io/tg-app-live` (точне значення уточнити при реалізації).
2. `vite.config.ts` → `base: '/tg-app-live/'` (замість `/reactjs-template/`).
3. `pnpm run deploy` (= `predeploy` → `build` → `gh-pages -d dist`) пушить `dist` у гілку `gh-pages`.

Прив'язка до Telegram (виконує користувач, не агент):
- @BotFather → створити бота (якщо немає) → `/newapp` або `/setmenubutton` → вставити URL Pages.
- Відкрити Mini App на реальному пристрої/клієнті.

> Дії в @BotFather (створення бота, прив'язка) — за користувачем.
> `pnpm run deploy` агент може запустити, але push у git / публікацію погоджує окремо перед виконанням.

## Критерії приймання (Definition of Done)

- [ ] `pnpm install` проходить; `pnpm run dev` стартує локально без помилок.
- [ ] Звірено фактичне CloudStorage API SDK v3 по типах у `node_modules`; `cloudStorage.ts` компілюється.
- [ ] `pnpm run build` (`tsc --noEmit && vite build`) проходить без помилок.
- [ ] Додаток задеплоєний, відкривається в реальному Telegram-клієнті.
- [ ] **Round-trip:** ввід → «Зберегти» → «Прочитати» → показано те саме значення.
- [ ] **Персистентність:** зберіг → повністю закрив Mini App → відкрив знову → значення підвантажилось автоматично.
- [ ] TON Connect повністю прибраний (немає `@tonconnect`, manifest, провайдера).

## Поза скоупом (цього кроку)

Шифрування (PBKDF2/AES/KCV), менеджери-контексти (Settings/Encryption/Storage),
кілька ключів / повний CRUD сейфа, біометрія, міграції схеми, локальний тунель.
Усе це — наступні кроки за `PROJECT_PLAN.md` після підтвердження, що CloudStorage працює.
