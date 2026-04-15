# Debt Manager Workspace Context

## Monorepo tuzilmasi

- apps/web: Asosiy frontend (React + TypeScript + Vite)
- apps/server: API server (Express + tRPC)
- apps/bot: Telegram bot qismi

## Frontend (apps/web)

- Asosiy UI va sahifalar shu yerda
- Modal va dialog komponentlari:
	- src/components/modals
	- src/components/ui/sheet.tsx
	- src/components/ui/dialog.tsx
- Dizayn yo'nalishi: mobile-first, neumorphic surface, yengil overlay, qisqa va silliq animatsiya

## Lokal ishga tushirish

- Frontend dev: npm run frontend:dev
- Frontend design mode: npm run frontend:design
- Frontend build: npm run frontend:build

## Design mode

- VITE_DESIGN_MODE=true bo'lganda dizayn uchun mock ma'lumotlar ishlatiladi
- Maqsad: backendga bog'lanmasdan UI/UX polishing qilish

## Ishlash qoidalari (joriy amaliyot)

- UI topshiriqlarda faqat presentatsion qatlam o'zgartiriladi
- Logic, state, API, auth, backend va biznes oqimga tegilmaydi
- Iconlarda bitta vizual til saqlanadi (hozirgi kod bazada lucide-react ishlatiladi)

## Oxirgi holat

- Modal overlay/surface va close affordance vizual jihatdan yangilangan
- Modal header/spacing/action footerlari birxillashtirilgan
- Frontend build muvaffaqiyatli o'tgan
