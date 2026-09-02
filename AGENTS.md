# Agent notes – Sarafi Digital Suite

- Frontend: TanStack Start + React + Tailwind at repo root
- Backend: FastAPI in `backend/` with Docker Postgres
- Do not reintroduce Lovable or Supabase packages
- Prefer httpOnly cookie auth; never commit `.env` secrets

## Localization (i18n)

- Locales: **fa** (default, RTL), **en** (LTR), **ps** (Pashto, RTL)
- UI catalogs: `src/i18n/messages/{fa,en,ps}.ts` — use `useLocale().t()` / `n()` / `d()`
- Cookie: `sarafi_locale` (see `src/i18n/cookie.ts`); language switcher in Header / AppHeader
- Document `lang`/`dir` follow the active locale (bootstrap script + LocaleProvider)
- CMS defaults: `settings.*` catalog + `useSiteSettings().get()`; prefer `value_en`/`value_ps` when present
- Entity content: `*_fa` required, nullable `*_en` / `*_ps` — use `pickLocalized(row, base, locale)`
- Fonts: Vazirmatn + Noto Sans Arabic (`src/lib/fonts.ts`)
