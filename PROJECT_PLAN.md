# tg-app-live — План проєкту

## Що ми будуємо

**Приватний vault-додаток як Telegram Mini App.** Юзер зберігає чутливі дані
(секрети / нотатки / записи), які **шифруються паролем на пристрої** і лежать у
**Telegram CloudStorage**. Бекенду немає — Telegram сам є сховищем.

**Ключові рішення:**
- **Тип:** особистий інструмент / сейф (приватні дані, шифрування).
- **Платформа:** **лише Telegram** (без браузерного фолбеку).
- **Стек:** React 18 · `@telegram-apps/telegram-ui` · `@tma.js/sdk-react` v3 · Vite 6 · `crypto-js`.

## Архітектура (звідки що беремо)

> **Фундамент = `reference/reactjs-template`** + **data-логіка = `reference/TeleOTP`**.

```
React skeleton (reactjs-template)          Data layer (TeleOTP)
├─ Двофазний bootstrap (init→render)       ├─ Manager-context: Settings→Encryption→Storage
├─ Захисне монтування SDK                   ├─ EncryptionManager: PBKDF2 + AES + KCV
├─ AppRoot тема (useSignal isDark)          ├─ StorageManager: CloudStorage як БД
├─ HashRouter + типізовані роути            ├─ 4-станний auth-gate у Root
├─ <Page> back-button обгортка             ├─ Engine міграцій схеми (version+ланцюг)
├─ mockEnv для dev + eruda                  └─ (опц.) Біометричний unlock
└─ ❌ прибрати TON Connect
```

**Порт:** TeleOTP написаний на сирому `window.Telegram.WebApp.*` → переписуємо
під `@tma.js/sdk-react` v3 (CloudStorage / biometrics / theme).

## Структура (ціль)

```
src/
  index.tsx              # bootstrap (з reactjs-template)
  init.ts                # init SDK
  mockEnv.ts             # dev-мок
  components/
    Root.tsx             # провайдери + auth-gate
    App.tsx              # AppRoot тема + роутер
    Page.tsx             # back-button обгортка
  managers/
    settings.tsx         # локальні налаштування
    encryption.tsx       # PBKDF2 / AES / KCV
    storage/
      storage.tsx        # CloudStorage CRUD
      migrate.ts         # engine міграцій
      migrations.ts      # версії схеми
  pages/
    PasswordSetup.tsx    # створення пароля
    Decrypt.tsx          # розблокування
    Vault.tsx            # список записів
    ItemEdit.tsx         # створення/редагування
  navigation/routes.tsx
```

## Етапи

- [ ] **0. Скелет** — скопіювати reactjs-template у `src/`, прибрати TON Connect, `npm install`, перевірити `npm run dev` з mockEnv.
- [ ] **1. Тема й навігація** — AppRoot, HashRouter, `<Page>`, базові порожні екрани.
- [ ] **2. EncryptionManager** — PBKDF2-деривація, AES (свіжий IV), KCV-верифікація. Unit-тести (Vitest).
- [ ] **3. StorageManager** — обгортка CloudStorage (SDK v3): save/load/remove + encrypt/decrypt. Метаключі salt/kcv/version.
- [ ] **4. Auth-gate** — Root: `storageChecked → passwordCreated → isLocked → ready`. Екрани PasswordSetup / Decrypt.
- [ ] **5. CRUD vault** — список записів, додавання, редагування, видалення. MainButton/BackButton.
- [ ] **6. Міграції схеми** — `version` + ланцюг `Migration<From,To>` + тест.
- [ ] **7. (опц.) Біометрія** — BiometricManager для швидкого розблокування.
- [ ] **8. Збірка/деплой** — `tsc --noEmit && vite build`, `base` для хостингу, бот-лінк на Mini App.

## Поза скоупом (поки що)

- Бекенд / БД / синхронізація між юзерами (див. `telegram-wishlist-miniapp` якщо знадобиться).
- Браузерний фолбек / Platform Abstraction Layer (див. `memo-card`).
- Платежі, i18n, AI (див. `memo-card` як довідник на майбутнє).

## Ризики / відкриті питання

- **Ліміти CloudStorage** Telegram (розмір значення / кількість ключів) — перевірити перед фінальною схемою.
- **Втрата пароля** = втрата даних (за дизайном для сейфа). Потрібен явний UX-варнінг + опційний експорт.
- **API-сумісність** TeleOTP-логіки з SDK v3 — головна технічна робота на етапах 2-3.
