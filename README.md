# PLATFORMA — Telegram Mini App Marketplace (Prototype)

A frontend-only Vinted/Depop-style marketplace prototype built as a Telegram
Mini App: React + TypeScript + Tailwind CSS, clean flat minimal design (solid
green accent, no gradients, no glassmorphism/blur) integrated with the
Telegram Web App SDK. All data is mock/local — there is no real backend or
payment integration (see [Swapping in a real backend](#swapping-in-a-real-backend-n8n)).

## Requirements

- [Node.js](https://nodejs.org/) 18+ and npm (**not installed in the environment
  this project was generated in** — install it yourself before running the
  commands below).

## Getting started

```bash
npm install
npm run dev
```

This starts Vite's dev server (default `http://localhost:5173`). Open it in a
regular browser to develop/preview — the app falls back gracefully to mock
user data and browser `confirm`/`alert` when `window.Telegram.WebApp` isn't
present, so you don't need a real Telegram client for day-to-day UI work.

To build for production:

```bash
npm run build
npm run preview
```

## Testing inside real Telegram

1. Run `npm run dev` (or deploy the `dist/` build from `npm run build`
   somewhere public).
2. Expose it over HTTPS — for local dev, tunnel it (e.g. `ngrok http 5173`).
3. Register/point a Telegram bot's Mini App URL at that HTTPS address via
   [@BotFather](https://t.me/BotFather) (`/newapp` or `/mybots` →
   *Bot Settings* → *Menu Button* / *Mini Apps*).
4. Open the bot in Telegram and launch the Mini App — you should see the real
   Telegram user's name/photo on the Profile screen, native theme colors, and
   the Telegram `MainButton`/`BackButton` in place of the in-page fallbacks.

## Project structure

```
src/
  types/          Item, User, ItemFilters, etc. — the shared domain model
  data/           Seed mock data (8-10 sample items, 4 sample users)
  services/
    api.ts        <-- THE swap-in seam. Every "backend call" goes through here.
    telegram.ts   Thin wrapper around window.Telegram.WebApp
  context/        AppContext — current user, favorites, theme, shared app state
  hooks/          useTelegramTheme, useMainButton, useBackButton
  components/
    common/       GlassCard, PricePill, ConditionBadge, Avatar, SearchBar,
                  PromoBanner, CategoryIconRow, QuickFilterChips, ...
    item/         ItemCard, ItemGrid
    filters/      FilterSheet, PriceRangeSlider, ChipSelect, ColorSwatches
    profile/      TabSwitcher, SettingsSheet
    layout/       BottomNav, ScreenHeader, HomeHeader, Sheet (generic bottom sheet)
  screens/        FeedScreen, SearchScreen, ItemDetailScreen, UploadScreen,
                  ProfileScreen, CharityScreen
```

Favorites has no dedicated bottom-nav tab — it's reachable via **Profile →
Favorites** (the bottom-nav heart slot is now the **Charity** tab).

## Swapping in a real backend (n8n)

Every "API call" the UI makes goes through **`src/services/api.ts`** — nothing
else in the app talks to mock data directly. Each exported function is
already `async` and returns the same typed shape a real endpoint would:

| Function | Current behavior | Later: point at n8n |
|---|---|---|
| `getCurrentUser()` | Reads `window.Telegram.WebApp.initDataUnsafe.user` directly | POST raw `initData` to a webhook that validates the Telegram signature server-side and returns a full stored profile |
| `getItems(filters)` | Filters/sorts/paginates the in-memory mock array | GET/POST with `filters` as query/body |
| `getItemById(id)` | Mock lookup | GET `/items/:id` |
| `createListing(data)` | Pushes into the mock store + localStorage | POST `data` as the webhook body |
| `toggleFavorite(id)` | Mutates a local favorites list | POST `/favorites/:id/toggle` |
| `uploadImage(file)` | Returns a local `URL.createObjectURL(file)` | Multipart POST to an upload webhook, returning a hosted URL |
| `deleteListing` / `markAsSold` / `getItemsBySeller` / `getUserProfile` | Mock store reads/writes | Matching REST/webhook calls |
| `getCharities()` | Returns mock charity organizations | GET `/charities`, optionally filtered by user location |

To wire up n8n: add a `VITE_N8N_BASE_URL` env var, replace each function body
with a `fetch()` call to `${VITE_N8N_BASE_URL}/<route>`, and keep the return
types identical. No component or screen needs to change.

## Notes on this prototype

- **Persistence**: created listings and favorites are saved to
  `localStorage` (key `platforma_mock_store_v1`) so they survive a page
  reload during a demo — this whole mechanism disappears once `api.ts` is
  wired to a real backend.
- **Charity tab**: lists fictional organizations accepting clothing
  donations (`src/data/mockCharities.ts`) — not real charities, placeholder
  content for the prototype.
- **No payments**: "Buy now" and "Message seller" on the item detail screen
  are intentionally non-functional placeholders (a Telegram `showAlert`
  explains this) — payment/messaging integration comes later.
- **Images**: sample photos are placeholder images from picsum.photos /
  pravatar.cc, seeded deterministically per item/user.
