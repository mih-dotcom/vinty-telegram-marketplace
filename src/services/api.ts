// ─────────────────────────────────────────────────────────────────────────
// API LAYER — the single seam between the UI and its data source.
//
// Every function here is async and returns plain domain types (see
// src/types). Right now they read/write an in-memory + localStorage mock
// store. When a real backend exists, swap each function's *body* for a
// `fetch()` call to the matching n8n webhook URL — call sites elsewhere in
// the app do not need to change, since the signatures/return shapes stay
// the same.
//
// Suggested future wiring (all via env vars, e.g. VITE_N8N_BASE_URL):
//   getCurrentUser()   -> POST {N8N_BASE_URL}/identify        { initData }
//   getItems(filters)  -> GET  {N8N_BASE_URL}/items?...       filters as query
//   getItemById(id)    -> GET  {N8N_BASE_URL}/items/:id
//   createListing(data)-> POST {N8N_BASE_URL}/listings        data as JSON body
//   toggleFavorite(id) -> POST {N8N_BASE_URL}/favorites/:id/toggle
//   uploadImage(file)  -> POST {N8N_BASE_URL}/upload          multipart/form-data
// ─────────────────────────────────────────────────────────────────────────

import type {
  CreateListingInput,
  Item,
  ItemFilters,
  PaginatedResult,
  User,
} from '../types'
import { mockItems } from '../data/mockItems'
import { getUserById, mockUsers } from '../data/mockUsers'
import { telegram } from './telegram'

// ---------------------------------------------------------------------------
// Mock persistence: in-memory store, seeded from mock data and hydrated from
// localStorage so listings/favorites survive a page reload during the demo.
// This whole block disappears once real endpoints are wired up.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'vinty_mock_store_v1'

interface MockStore {
  items: Item[]
  favoriteIds: string[]
}

function loadStore(): MockStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MockStore
      // Merge with base mock items in case new seed items were added since last save.
      const knownIds = new Set(parsed.items.map((i) => i.id))
      const merged = [...parsed.items, ...mockItems.filter((i) => !knownIds.has(i.id))]
      return { items: merged, favoriteIds: parsed.favoriteIds ?? [] }
    }
  } catch {
    // ignore corrupt storage, fall through to fresh seed
  }
  return { items: [...mockItems], favoriteIds: [] }
}

function saveStore(store: MockStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // storage unavailable (e.g. private mode) — silently no-op for the prototype
  }
}

const store = loadStore()

// Simulated network latency so loading states are visible in the prototype.
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ---------------------------------------------------------------------------
// getCurrentUser — identifies "me".
//
// For now, reads window.Telegram.WebApp.initDataUnsafe.user directly. Later
// this should POST the raw initData string to an n8n webhook that validates
// the Telegram signature server-side and returns a richer stored profile
// (rating, listings, etc.) instead of trusting the client-side payload.
// ---------------------------------------------------------------------------
export async function getCurrentUser(): Promise<User> {
  await wait(150)

  const tgUser = telegram.getInitDataUnsafe()?.user
  const fallback = getUserById('me')!

  if (!tgUser) return fallback

  return {
    ...fallback,
    id: String(tgUser.id),
    name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || fallback.name,
    username: tgUser.username ?? fallback.username,
    avatarUrl: tgUser.photo_url ?? fallback.avatarUrl,
  }
}

// ---------------------------------------------------------------------------
// getItems — paginated, filterable feed query.
// ---------------------------------------------------------------------------
export async function getItems(filters: ItemFilters = {}): Promise<PaginatedResult<Item>> {
  await wait(400)

  const {
    query,
    category,
    minPrice,
    maxPrice,
    sizes,
    conditions,
    brands,
    colors,
    sortBy = 'newest',
    page = 1,
    pageSize = 8,
  } = filters

  // Sold items stay visible in the feed (with a "Sold" badge) rather than disappearing.
  let results = [...store.items]

  if (query?.trim()) {
    const q = query.trim().toLowerCase()
    results = results.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    )
  }
  if (category && category !== 'All') {
    results = results.filter((i) => i.category === category)
  }
  if (typeof minPrice === 'number') {
    results = results.filter((i) => i.price >= minPrice)
  }
  if (typeof maxPrice === 'number') {
    results = results.filter((i) => i.price <= maxPrice)
  }
  if (sizes?.length) {
    results = results.filter((i) => sizes.includes(i.size))
  }
  if (conditions?.length) {
    results = results.filter((i) => conditions.includes(i.condition))
  }
  if (brands?.length) {
    results = results.filter((i) => brands.includes(i.brand))
  }
  if (colors?.length) {
    results = results.filter((i) => i.color && colors.includes(i.color))
  }

  switch (sortBy) {
    case 'price_low':
      results = [...results].sort((a, b) => a.price - b.price)
      break
    case 'price_high':
      results = [...results].sort((a, b) => b.price - a.price)
      break
    case 'newest':
    default:
      results = [...results].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      break
  }

  const withFavorites = results.map((i) => ({
    ...i,
    favorited: store.favoriteIds.includes(i.id),
  }))

  const start = (page - 1) * pageSize
  const pageItems = withFavorites.slice(start, start + pageSize)

  return {
    items: pageItems,
    page,
    pageSize,
    total: withFavorites.length,
    hasMore: start + pageSize < withFavorites.length,
  }
}

// ---------------------------------------------------------------------------
// getItemById — single item detail lookup.
// ---------------------------------------------------------------------------
export async function getItemById(id: string): Promise<Item | undefined> {
  await wait(250)
  const item = store.items.find((i) => i.id === id)
  if (!item) return undefined
  return { ...item, favorited: store.favoriteIds.includes(item.id) }
}

// ---------------------------------------------------------------------------
// createListing — publishes a new item from the Upload screen.
//
// Later: POST `data` as JSON to the n8n "create listing" webhook, which
// would persist it and return the canonical stored Item (with server id).
// ---------------------------------------------------------------------------
export async function createListing(data: CreateListingInput): Promise<Item> {
  await wait(600)

  const currentUser = await getCurrentUser()

  const newItem: Item = {
    id: `local-${Date.now()}`,
    title: data.title,
    price: data.price,
    currency: '$',
    images: data.images.length ? data.images : ['https://picsum.photos/seed/newitem/640/800'],
    size: data.size,
    brand: data.brand,
    condition: data.condition,
    category: data.category,
    color: data.color,
    sellerId: currentUser.id,
    description: data.description,
    createdAt: new Date().toISOString(),
  }

  store.items.unshift(newItem)
  saveStore(store)

  return newItem
}

// ---------------------------------------------------------------------------
// toggleFavorite — like/unlike an item. Returns the new favorited state.
// ---------------------------------------------------------------------------
export async function toggleFavorite(id: string): Promise<boolean> {
  await wait(120)

  const idx = store.favoriteIds.indexOf(id)
  const nowFavorited = idx === -1
  if (nowFavorited) {
    store.favoriteIds.push(id)
  } else {
    store.favoriteIds.splice(idx, 1)
  }
  saveStore(store)
  return nowFavorited
}

// ---------------------------------------------------------------------------
// getFavoriteItems — convenience helper for the Favorites screen.
// ---------------------------------------------------------------------------
export async function getFavoriteItems(): Promise<Item[]> {
  await wait(300)
  return store.items
    .filter((i) => store.favoriteIds.includes(i.id))
    .map((i) => ({ ...i, favorited: true }))
}

// ---------------------------------------------------------------------------
// getItemsBySeller — used by the Profile "My Listings" / "Sold" tabs.
// ---------------------------------------------------------------------------
export async function getItemsBySeller(sellerId: string): Promise<Item[]> {
  await wait(300)
  return store.items
    .filter((i) => i.sellerId === sellerId)
    .map((i) => ({ ...i, favorited: store.favoriteIds.includes(i.id) }))
}

// ---------------------------------------------------------------------------
// getUserProfile — public profile lookup (e.g. tapping a seller).
// ---------------------------------------------------------------------------
export async function getUserProfile(userId: string): Promise<User | undefined> {
  await wait(200)
  return mockUsers.find((u) => u.id === userId)
}

// ---------------------------------------------------------------------------
// uploadImage — TODO(n8n): point this at a real upload webhook.
//
// For the prototype, we just turn the picked File into a local object URL so
// it can be previewed/stored immediately with zero backend. Swap the body
// for a multipart POST to n8n which would return a permanent hosted URL.
// ---------------------------------------------------------------------------
export async function uploadImage(file: File): Promise<string> {
  await wait(300) // simulate upload latency
  return URL.createObjectURL(file)
}

// ---------------------------------------------------------------------------
// deleteListing — remove one of the current user's own items.
// ---------------------------------------------------------------------------
export async function deleteListing(id: string): Promise<void> {
  await wait(250)
  store.items = store.items.filter((i) => i.id !== id)
  saveStore(store)
}

// ---------------------------------------------------------------------------
// markAsSold — toggle sold state on one of the current user's own items.
// ---------------------------------------------------------------------------
export async function markAsSold(id: string, sold = true): Promise<void> {
  await wait(200)
  const item = store.items.find((i) => i.id === id)
  if (item) item.sold = sold
  saveStore(store)
}

// Known filter facets, surfaced for building the filter sheet UI.
export const FACETS = {
  categories: ['Women', 'Men', 'Kids', 'Shoes', 'Bags', 'Accessories'] as const,
  conditions: ['New with tags', 'Very good', 'Good', 'Satisfactory'] as const,
  sizes: ['XS', 'S', 'M', 'L', 'XL', '36', '38', '40', '42', '44', 'One size'],
  colors: [
    { name: 'Black', hex: '#111111' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Grey', hex: '#9CA3AF' },
    { name: 'Beige', hex: '#E4D4B4' },
    { name: 'Brown', hex: '#7B4B2A' },
    { name: 'Blue', hex: '#2563EB' },
    { name: 'Green', hex: '#00B248' },
    { name: 'Yellow', hex: '#FACC15' },
    { name: 'Gold', hex: '#D4AF37' },
  ],
  brands: ["Levi's", 'Nike', 'Coach', 'Zara', 'Hunter', 'Mejuri', 'H&M', 'Uniqlo', 'Muji', 'Adidas'],
}
