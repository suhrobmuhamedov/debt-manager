# Debt Manager Workspace Context

## Loyiha haqida qisqacha

- Bu repo Telegram Mini App asosidagi shaxsiy qarz boshqaruvi loyihasi.
- Asosiy use-case: foydalanuvchi Telegram orqali tizimga kiradi, kontaktlar va qarzlarni boshqaradi, to'lovlarni kiritadi, kerak bo'lsa qarzni ikkinchi tomonga Telegram orqali tasdiqlatadi.
- Tizim 3 qismdan iborat: frontend mini app, backend API, Telegram bot.
- Loyiha ichida "QarzTrust" nomi ham ishlatiladi.

## Monorepo tuzilmasi

- `apps/web`: React frontend, Telegram ichidagi mini app.
- `apps/server`: Express + tRPC backend, auth va biznes logika shu yerda.
- `apps/bot`: Telegraf asosidagi Telegram bot.
- `packages`: hozircha bo'sh.
- Root `package.json` asosan frontend uchun shortcut skriptlarni beradi.

## Asosiy texnologiyalar

- Frontend: React 19, TypeScript, Vite, Wouter, TanStack Query, tRPC client, Zustand, i18next, Tailwind CSS v4, Radix UI, Sonner.
- Backend: Express 5, tRPC v11, Drizzle ORM, MySQL, express-session, JWT, dotenv.
- Bot: Telegraf, axios, mysql2.
- Infra: `turbo.json` mavjud, `railway.toml` server deploy uchun sozlangan.

## Mahsulot imkoniyatlari

- Berilgan va olingan qarzlarni yuritish.
- Kontaktlar bazasini saqlash.
- To'lov yoki qarzga qo'shimcha summa kiritish.
- Qarz holatlari: `pending`, `partial`, `paid`.
- Ikki tomonlama tasdiqlash oqimi:
  qarz yaratilganda Telegram orqali confirm/deny link yuborilishi mumkin.
- Tasdiqlangan qarz uchun qarama-qarshi tomonda mirror debt yaratiladi.
- Reminder oqimi:
  qo'lda eslatma yuborish va server tomonda muddati yaqin qarzlar uchun digest yuborish.
- Profil, til va theme sozlamalari mavjud.

## Frontend konteksti (`apps/web`)

- Entry point: `apps/web/src/main.tsx`
- Asosiy router: `apps/web/src/App.tsx`
- Sahifalar:
  `Dashboard`, `Debts`, `DebtDetail`, `Contacts`, `ContactDetail`, `Profile`, `NotFound`
- Modal tizimi Zustand orqali ishlaydi:
  `apps/web/src/store/modalStore.ts` + `apps/web/src/components/modals/ModalRenderer.tsx`
- Asosiy modal turlari:
  `CREATE_DEBT`, `EDIT_DEBT`, `DELETE_DEBT`, `CREATE_CONTACT`, `EDIT_CONTACT`, `ADD_PAYMENT`, `DEBT_CONFIRMATION`
- Auth oqimi:
  `useAuth` Telegram WebApp `initData` ni olib `trpc.auth.telegramLogin` ga yuboradi.
- Frontend Telegram ichida ishlashga mo'ljallangan.
  `AuthWrapper` Telegram bo'lmagan holatda fallback UI ko'rsatadi.
- Dev rejimda `isTelegram()` true qaytaradi va `getInitData()` `dev_mode` yuboradi.
  Server buni test user sifatida qabul qiladi.
- Design mode mavjud:
  `VITE_DESIGN_MODE=true` bo'lsa mock data ishlatiladi va write amallar read-only bo'ladi.
- I18n:
  `apps/web/src/locales/uz.ts`
  `apps/web/src/locales/ru.ts`
- UI yo'nalishi:
  mobile-first, glass/neumorphic cardlar, Telegram mini app hissi, modallar va sheet/dialog patternlari faol ishlatiladi.

## Backend konteksti (`apps/server`)

- Entry point: `apps/server/src/index.ts`
- Health endpoint: `/health`
- tRPC routerlar:
  `auth`, `contacts`, `debts`, `payments`, `dashboard`
- Router registratsiyasi:
  `apps/server/src/routers/index.ts`
- Auth manbalari:
  session ichidagi `userId`, `Authorization: Bearer`, yoki `x-auth-token`
- `auth.telegramLogin` Telegram init data ni tekshiradi va foydalanuvchini yaratadi yoki topadi.
- `dashboard.getStats` dashboard kartalari va recent debts uchun agregatsiya qaytaradi.
- `contacts` router CRUD va kontakt bo'yicha debt statistikani beradi.
- `debts` router eng muhim biznes logikani tutadi:
  create, update, delete, summary, overdue, reminder, confirmation link, confirm, deny.
- `payments` router to'lov qo'shish, debtni adjust qilish, history olish va payment delete qilishni boshqaradi.
- Server tarafdagi internal API endpointlar bot uchun ishlaydi:
  `/api/internal/confirmation/:token`
  `/api/internal/confirm-debt`
  `/api/internal/deny-debt`
  `/api/internal/bot-user-sync`
  `/api/internal/stats/:telegramId`
  `/api/internal/user-profile/:telegramId`
- Reminder job:
  `apps/server/src/jobs/reminders.job.ts`
  server ishga tushganda start bo'ladi va har soatda due-soon digest yuborishni tekshiradi.

## Bot konteksti (`apps/bot`)

- Entry point: `apps/bot/src/index.ts`
- Asosiy commandlar:
  `/start`, `/help`, `/balance`
- `start` command foydalanuvchini server bilan sync qiladi va payload-based oqimlarni ushlaydi:
  `confirm_*`, `deny_*`, `login_*`
- Debt confirmation callbacklari bot orqali server internal API ga ulanadi.
- Bot singleton polling lock ishlatadi:
  MySQL `GET_LOCK` orqali bitta aktiv poller saqlanadi.
- Agar `ADMIN_FORWARD_TELEGRAM_ID` berilgan bo'lsa, oddiy user xabarlari admin'ga forward qilinadi.
- Bot serverga `x-internal-api-key` bilan ulanadi.

## Ma'lumotlar modeli

- `users`:
  Telegram user identifikatori, ism, username, telefon, til, `botStartedAt`, `lastReminderDigestAt`
- `contacts`:
  user-owned kontakt, telefon, Telegram username, note, soft delete
- `debts`:
  amount, paidAmount, currency, type (`given`/`taken`), status, confirmation status, confirmation token, linked debt, sanalar, note, soft delete
- `payments`:
  debt bo'yicha payment yoki history entry, `paymentDate`, `amount`, `note`

## Muhim biznes qoidalari

- Ikki tomonlama tasdiqlangan debtlarda mirror debt yaratiladi.
- Bunday debtlarda odatda faqat qarz bergan tomon edit/payment amallarini boshqaradi.
- `returnDate` o'tgan sana bo'la olmaydi va `givenDate` dan keyin bo'lishi kerak.
- Kontaktni o'chirishdan oldin aktiv debtlar yo'qligi tekshiriladi.
- Debt o'chirish soft delete orqali bajariladi.
- Reminder yuborishda imkon bo'lsa bot qarzdorga to'g'ridan-to'g'ri yuboradi, bo'lmasa owner'ga forward qilish uchun matn yuboradi.

## Muhim fayllar

- Frontend:
  `apps/web/src/App.tsx`
  `apps/web/src/hooks/useAuth.ts`
  `apps/web/src/lib/trpc.ts`
  `apps/web/src/lib/telegram.ts`
  `apps/web/src/lib/design-mode.ts`
  `apps/web/src/store/authStore.ts`
  `apps/web/src/store/modalStore.ts`
- Backend:
  `apps/server/src/index.ts`
  `apps/server/src/trpc.ts`
  `apps/server/src/routers/*.ts`
  `apps/server/src/db/schema/*.ts`
  `apps/server/src/services/notification.service.ts`
- Bot:
  `apps/bot/src/index.ts`
  `apps/bot/src/commands/*.ts`
  `apps/bot/src/utils/internal-api.ts`

## Lokal ishga tushirish

- Root shortcutlar:
  `npm run frontend:dev`
  `npm run frontend:design`
  `npm run frontend:build`
- Frontend workspace ichida:
  `npm --workspace apps/web run dev`
  `npm --workspace apps/web run build`
- Server workspace ichida:
  `npm --workspace apps/server run dev`
  `npm --workspace apps/server run build`
  `npm --workspace apps/server run start`
- Bot workspace ichida:
  `npm --workspace apps/bot run dev`
  `npm --workspace apps/bot run build`
  `npm --workspace apps/bot run start`
- Eslatma:
  serverdagi `dev` skripti hozir hot reload emas, avval build qiladi va keyin `dist/index.js` ni ishga tushiradi.

## Environment o'zgaruvchilari

- Root `.env.example` da quyidagilar bor:
  `DATABASE_URL`
  `BOT_TOKEN`
  `SESSION_SECRET`
  `WEB_APP_URL`
  `BOT_USERNAME`
  `PORT`
  `INTERNAL_API_KEY`
  `ADMIN_FORWARD_TELEGRAM_ID`
  `VITE_BOT_USERNAME`
  `VITE_SERVER_URL`
- Server root `.env` ni o'qiydi.
- Bot kodida `SERVER_URL` ham ishlatiladi, lekin u hozir `.env.example` ichida hujjatlashtirilmagan.
- Bot env load qilish logikasi `apps/bot/.env` faylini kutadi.

## Deploy va infra eslatmalar

- `railway.toml` server Dockerfile asosida deploy bo'lishini ko'rsatadi:
  `apps/server/Dockerfile`
- Server `trust proxy` yoqilgan, Railway kabi proxy ortidagi deploy uchun muhim.
- Cookie `secure: true` va `sameSite: 'none'` bilan sozlangan.

## Joriy ishlash qoidalari

- UI topshiriqlarda presentatsion qatlamni biznes logikadan ajratib ko'rish kerak.
- Modal oqimlari va store patternlari allaqachon mavjud, yangi UI ishlarida shu patternni davom ettirish afzal.
- Telegram integratsiyasi bor joylarda browser-only fallback va Desktop Telegram cheklovlari hisobga olingan.
- Repo ichida avtomatlashtirilgan testlar ko'rinmadi;
  odatda build va manual flow verification kerak bo'ladi.

## Ehtiyot bo'ladigan joylar

- Frontend auth dev rejimda maxsus `dev_mode` flow bilan ishlaydi, prod logikadan farq qiladi.
- Bot va server env joylashuvi bir xil emas, local setup paytida bunga e'tibor kerak.
- Confirmation/reminder oqimlari web, server va bot orasida bo'lingan;
  bitta joydagi o'zgarish boshqa ikki qismga ham ta'sir qilishi mumkin.
