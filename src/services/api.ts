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
// POSTs the raw, signed Telegram initData string to the n8n "identify"
// webhook, which validates the signature server-side (using the bot token —
// never exposed to the client) and returns/creates the stored Supabase
// profile. Falls back to local mock data if:
//   - VITE_N8N_BASE_URL isn't set (e.g. local dev without a backend yet), or
//   - the app isn't running inside real Telegram (no initData to send), or
//   - the webhook call fails for any reason (network, n8n down, etc.)
// This keeps the UI usable during development even before/without the
// backend being reachable.
// ---------------------------------------------------------------------------
export async function getCurrentUser(): Promise<User> {
  const fallback = getUserById('me')!
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    await wait(150)
    const tgUser = telegram.getInitDataUnsafe()?.user
    if (!tgUser) return fallback
    return {
      ...fallback,
      id: String(tgUser.id),
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || fallback.name,
      username: tgUser.username ?? fallback.username,
      avatarUrl: tgUser.photo_url ?? fallback.avatarUrl,
    }
  }

  try {
    const res = await fetch(`${n8nBaseUrl}/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: rawInitData }),
    })
    if (!res.ok) throw new Error(`identify webhook returned ${res.status}`)
    const user = (await res.json()) as User
    return user
  } catch (err) {
    console.error('getCurrentUser: falling back to local mock user —', err)
    return fallback
  }
}

// ---------------------------------------------------------------------------
// getItems — paginated, filterable feed query.
//
// GETs {N8N_BASE_URL}/items with filters as query params. Falls back to the
// local mock store if VITE_N8N_BASE_URL isn't set or the request fails, so
// the feed stays usable during development.
// ---------------------------------------------------------------------------
export async function getItems(filters: ItemFilters = {}): Promise<PaginatedResult<Item>> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined

  if (!n8nBaseUrl) {
    return getItemsMock(filters)
  }

  try {
    const params = new URLSearchParams()
    if (filters.query) params.set('query', filters.query)
    if (filters.category) params.set('category', filters.category)
    if (typeof filters.minPrice === 'number') params.set('minPrice', String(filters.minPrice))
    if (typeof filters.maxPrice === 'number') params.set('maxPrice', String(filters.maxPrice))
    if (filters.sizes?.length) params.set('sizes', filters.sizes.join(','))
    if (filters.conditions?.length) params.set('conditions', filters.conditions.join(','))
    if (filters.brands?.length) params.set('brands', filters.brands.join(','))
    if (filters.colors?.length) params.set('colors', filters.colors.join(','))
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.page) params.set('page', String(filters.page))
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

    const res = await fetch(`${n8nBaseUrl}/items?${params.toString()}`)
    if (!res.ok) throw new Error(`items webhook returned ${res.status}`)
    return (await res.json()) as PaginatedResult<Item>
  } catch (err) {
    console.error('getItems: falling back to local mock data —', err)
    return getItemsMock(filters)
  }
}

async function getItemsMock(filters: ItemFilters = {}): Promise<PaginatedResult<Item>> {
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
//
// GETs {N8N_BASE_URL}/items/:id. Falls back to the local mock store if
// VITE_N8N_BASE_URL isn't set, the request fails, or the item genuinely
// isn't found server-side either way.
// ---------------------------------------------------------------------------
export async function getItemById(id: string): Promise<Item | undefined> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined

  if (!n8nBaseUrl) {
    return getItemByIdMock(id)
  }

  try {
    const res = await fetch(`${n8nBaseUrl}/items/${encodeURIComponent(id)}`)
    if (!res.ok) throw new Error(`item detail webhook returned ${res.status}`)
    const data = (await res.json()) as (Item & { notFound?: boolean }) | { notFound: true }
    if ('notFound' in data && data.notFound) return undefined
    return data as Item
  } catch (err) {
    console.error('getItemById: falling back to local mock data —', err)
    return getItemByIdMock(id)
  }
}

async function getItemByIdMock(id: string): Promise<Item | undefined> {
  await wait(250)
  const item = store.items.find((i) => i.id === id)
  if (!item) return undefined
  return { ...item, favorited: store.favoriteIds.includes(item.id) }
}

// ---------------------------------------------------------------------------
// createListing — publishes a new item from the Upload screen.
//
// POSTs { initData, item: data } to {N8N_BASE_URL}/listings, which verifies
// the signature server-side, resolves the seller's Supabase id, and inserts
// the row. Falls back to the local mock store if VITE_N8N_BASE_URL isn't
// set, there's no real Telegram session, or the request fails.
// ---------------------------------------------------------------------------
export async function createListing(data: CreateListingInput): Promise<Item> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    return createListingMock(data)
  }

  try {
    const res = await fetch(`${n8nBaseUrl}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: rawInitData, item: data }),
    })
    if (!res.ok) throw new Error(`listings webhook returned ${res.status}`)
    return (await res.json()) as Item
  } catch (err) {
    console.error('createListing: falling back to local mock store —', err)
    return createListingMock(data)
  }
}

async function createListingMock(data: CreateListingInput): Promise<Item> {
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
//
// POSTs { initData } to {N8N_BASE_URL}/favorites/:id/toggle. Falls back to
// the local mock store if VITE_N8N_BASE_URL isn't set, there's no real
// Telegram session, or the request fails.
// ---------------------------------------------------------------------------
export async function toggleFavorite(id: string): Promise<boolean> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    return toggleFavoriteMock(id)
  }

  try {
    const res = await fetch(`${n8nBaseUrl}/favorites/${encodeURIComponent(id)}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: rawInitData }),
    })
    if (!res.ok) throw new Error(`favorites toggle webhook returned ${res.status}`)
    const data = (await res.json()) as { favorited: boolean }
    return data.favorited
  } catch (err) {
    console.error('toggleFavorite: falling back to local mock store —', err)
    return toggleFavoriteMock(id)
  }
}

async function toggleFavoriteMock(id: string): Promise<boolean> {
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
