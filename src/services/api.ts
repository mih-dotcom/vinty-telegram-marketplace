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
//   getItemById(id)    -> GET  {N8N_BASE_URL}/item-detail?id=
//   createListing(data)-> POST {N8N_BASE_URL}/listings        data as JSON body
//   toggleFavorite(id) -> POST {N8N_BASE_URL}/favorites-toggle
//   uploadImage(file)  -> POST {N8N_BASE_URL}/upload          multipart/form-data
// ─────────────────────────────────────────────────────────────────────────

import type {
  CharityOrg,
  Category,
  CreateListingInput,
  Gender,
  Item,
  ItemFilters,
  PaginatedResult,
  Subscription,
  User,
} from '../types'
import { mockItems } from '../data/mockItems'
import { getUserById, mockUsers } from '../data/mockUsers'
import { mockCharities } from '../data/mockCharities'
import { telegram } from './telegram'

// ---------------------------------------------------------------------------
// Mock persistence: in-memory store, seeded from mock data and hydrated from
// localStorage so listings/favorites survive a page reload during the demo.
// This whole block disappears once real endpoints are wired up.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'platforma_mock_store_v2'

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
// webhook, which validates the signature server-side and returns/creates
// the stored Supabase profile. Falls back to local Telegram data (or the
// mock user) if VITE_N8N_BASE_URL isn't set or the request fails.
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
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`identify webhook returned ${res.status}`)
    const data = (await res.json()) as User
    if (!data || typeof data.id !== 'string') {
      throw new Error('identify webhook returned an unexpected shape (missing id)')
    }
    return data
  } catch (err) {
    console.error('getCurrentUser: falling back to local mock user —', err)
    return fallback
  }
}

// ---------------------------------------------------------------------------
// getFavoritedIds — internal helper. Fetches the current user's favorited
// item ids from n8n (via the full favorites list endpoint) so getItems and
// getItemById can mark `favorited: true/false` on their results. Returns an
// empty Set on any failure or when there's no real Telegram session —
// browsing never breaks even if this call fails.
// ---------------------------------------------------------------------------
async function getFavoritedIds(): Promise<Set<string>> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) return new Set(store.favoriteIds)

  try {
    const res = await fetch(`${n8nBaseUrl}/favorites-list?initData=${encodeURIComponent(rawInitData)}`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`favorites-list webhook returned ${res.status}`)
    const data = (await res.json()) as { items: Item[] }
    if (!data || !Array.isArray(data.items)) {
      throw new Error('favorites-list webhook returned an unexpected shape (missing items[])')
    }
    return new Set(data.items.map((i) => i.id))
  } catch (err) {
    console.error('getFavoritedIds: falling back to empty set —', err)
    return new Set()
  }
}

// ---------------------------------------------------------------------------
// getItems — paginated, filterable feed query.
//
// GETs {N8N_BASE_URL}/items with filters as query params. Falls back to the
// local mock store if VITE_N8N_BASE_URL isn't set or the request fails.
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
    if (filters.subcategories?.length) params.set('subcategories', filters.subcategories.join(','))
    if (filters.genders?.length) params.set('genders', filters.genders.join(','))
    if (typeof filters.minPrice === 'number') params.set('minPrice', String(filters.minPrice))
    if (typeof filters.maxPrice === 'number') params.set('maxPrice', String(filters.maxPrice))
    if (filters.sizes?.length) params.set('sizes', filters.sizes.join(','))
    if (filters.conditions?.length) params.set('conditions', filters.conditions.join(','))
    if (filters.brands?.length) params.set('brands', filters.brands.join(','))
    if (filters.colors?.length) params.set('colors', filters.colors.join(','))
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.page) params.set('page', String(filters.page))
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

    const [res, favoritedIds] = await Promise.all([
      fetch(`${n8nBaseUrl}/items?${params.toString()}`, { cache: 'no-store' }),
      getFavoritedIds(),
    ])
    if (!res.ok) throw new Error(`items webhook returned ${res.status}`)
    const data = (await res.json()) as PaginatedResult<Item>
    // Guard against a webhook that isn't wired up correctly yet (wrong shape,
    // placeholder response, etc.) — an array is required downstream.
    if (!data || !Array.isArray(data.items)) {
      throw new Error('items webhook returned an unexpected shape (missing items[])')
    }
    return {
      ...data,
      items: data.items.map((i) => ({ ...i, favorited: favoritedIds.has(i.id) })),
    }
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
    subcategories,
    genders,
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

  // Sold items stay visible in the feed (with a "Продано" badge) rather than disappearing.
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
  if (subcategories?.length) {
    results = results.filter((i) => subcategories.includes(i.subcategory))
  }
  if (genders?.length) {
    results = results.filter((i) => i.gender !== null && genders.includes(i.gender))
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
// GETs {N8N_BASE_URL}/item-detail?id=. Falls back to the local mock store if
// VITE_N8N_BASE_URL isn't set, the request fails, or the item genuinely
// isn't found server-side either way.
// ---------------------------------------------------------------------------
export async function getItemById(id: string): Promise<Item | undefined> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined

  if (!n8nBaseUrl) {
    return getItemByIdMock(id)
  }

  try {
    const [res, favoritedIds] = await Promise.all([
      fetch(`${n8nBaseUrl}/item-detail?id=${encodeURIComponent(id)}`, { cache: 'no-store' }),
      getFavoritedIds(),
    ])
    if (!res.ok) throw new Error(`item detail webhook returned ${res.status}`)
    const data = (await res.json()) as (Item & { notFound?: boolean }) | { notFound: true }
    if ('notFound' in data && data.notFound) return undefined
    if (!data || typeof (data as Item).id !== 'string') {
      throw new Error('item detail webhook returned an unexpected shape (missing id)')
    }
    return { ...(data as Item), favorited: favoritedIds.has((data as Item).id) }
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
// POSTs { initData, item: data } to {N8N_BASE_URL}/listings. Falls back to
// the local mock store if VITE_N8N_BASE_URL isn't set, there's no real
// Telegram session, or the request fails.
// ---------------------------------------------------------------------------
export async function createListing(data: CreateListingInput): Promise<Item> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    return createListingMock(data)
  }

  let res: Response
  try {
    res = await fetch(`${n8nBaseUrl}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: rawInitData, item: data }),
      cache: 'no-store',
    })
  } catch (err) {
    console.error('createListing: network error, falling back to local mock store —', err)
    return createListingMock(data)
  }

  if (!res.ok) {
    let message = `listings webhook returned ${res.status}`
    try {
      const body = (await res.json()) as { message?: string }
      if (body?.message) message = body.message
    } catch {
      /* body wasn't JSON — keep default message */
    }
    // A real publish ban must never be silently swallowed by the mock
    // fallback — that would let a banned user "succeed" locally.
    if (message.startsWith('BANNED_UNTIL:')) {
      throw new Error(message)
    }
    console.error('createListing: falling back to local mock store —', message)
    return createListingMock(data)
  }

  const created = (await res.json()) as Item
  if (!created || typeof created.id !== 'string') {
    throw new Error('listings webhook returned an unexpected shape (missing id)')
  }
  return created
}

async function createListingMock(data: CreateListingInput): Promise<Item> {
  await wait(600)

  const currentUser = await getCurrentUser()

  const newItem: Item = {
    id: `local-${Date.now()}`,
    title: data.title,
    price: data.price,
    currency: '₽',
    images: data.images.length ? data.images : ['https://picsum.photos/seed/newitem/640/800'],
    size: data.size,
    brand: data.brand,
    condition: data.condition,
    category: data.category,
    subcategory: data.subcategory,
    gender: data.gender,
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
// POSTs { initData, itemId } to {N8N_BASE_URL}/favorites-toggle. Falls back
// to the local mock store if VITE_N8N_BASE_URL isn't set, there's no real
// Telegram session, or the request fails.
// ---------------------------------------------------------------------------
export async function toggleFavorite(id: string): Promise<boolean> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    return toggleFavoriteMock(id)
  }

  try {
    const res = await fetch(`${n8nBaseUrl}/favorites-toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: rawInitData, itemId: id }),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`favorites toggle webhook returned ${res.status}`)
    const data = (await res.json()) as { favorited: boolean }
    if (!data || typeof data.favorited !== 'boolean') {
      throw new Error('favorites toggle webhook returned an unexpected shape (missing favorited)')
    }
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
//
// GETs {N8N_BASE_URL}/favorites-list. Falls back to the local mock store if
// VITE_N8N_BASE_URL isn't set, there's no real Telegram session, or the
// request fails.
// ---------------------------------------------------------------------------
export async function getFavoriteItems(): Promise<Item[]> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    await wait(300)
    return store.items
      .filter((i) => store.favoriteIds.includes(i.id))
      .map((i) => ({ ...i, favorited: true }))
  }

  try {
    const res = await fetch(`${n8nBaseUrl}/favorites-list?initData=${encodeURIComponent(rawInitData)}`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`favorites-list webhook returned ${res.status}`)
    const data = (await res.json()) as { items: Item[] }
    if (!data || !Array.isArray(data.items)) {
      throw new Error('favorites-list webhook returned an unexpected shape (missing items[])')
    }
    return data.items
  } catch (err) {
    console.error('getFavoriteItems: falling back to local mock data —', err)
    return store.items
      .filter((i) => store.favoriteIds.includes(i.id))
      .map((i) => ({ ...i, favorited: true }))
  }
}

// ---------------------------------------------------------------------------
// getItemsBySeller — used by the Profile "My Listings" / "Sold" tabs.
//
// GETs {N8N_BASE_URL}/items-by-seller?sellerId=. Falls back to the local mock
// store if VITE_N8N_BASE_URL isn't set or the request fails.
// ---------------------------------------------------------------------------
export async function getItemsBySeller(sellerId: string): Promise<Item[]> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined

  if (!n8nBaseUrl) {
    await wait(300)
    return store.items
      .filter((i) => i.sellerId === sellerId)
      .map((i) => ({ ...i, favorited: store.favoriteIds.includes(i.id) }))
  }

  try {
    const [res, favoritedIds] = await Promise.all([
      fetch(`${n8nBaseUrl}/items-by-seller?sellerId=${encodeURIComponent(sellerId)}`, { cache: 'no-store' }),
      getFavoritedIds(),
    ])
    if (!res.ok) throw new Error(`items-by-seller webhook returned ${res.status}`)
    const data = (await res.json()) as { items: Item[] }
    if (!data || !Array.isArray(data.items)) {
      throw new Error('items-by-seller webhook returned an unexpected shape (missing items[])')
    }
    return data.items.map((i) => ({ ...i, favorited: favoritedIds.has(i.id) }))
  } catch (err) {
    console.error('getItemsBySeller: falling back to local mock data —', err)
    return store.items
      .filter((i) => i.sellerId === sellerId)
      .map((i) => ({ ...i, favorited: store.favoriteIds.includes(i.id) }))
  }
}

// ---------------------------------------------------------------------------
// getUserProfile — public profile lookup (e.g. tapping a seller).
//
// GETs {N8N_BASE_URL}/user-profile?id=. Falls back to the local mock data if
// VITE_N8N_BASE_URL isn't set, the request fails, or the user genuinely
// isn't found server-side either way.
// ---------------------------------------------------------------------------
export async function getUserProfile(userId: string): Promise<User | undefined> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined

  if (!n8nBaseUrl) {
    await wait(200)
    return mockUsers.find((u) => u.id === userId)
  }

  try {
    const res = await fetch(`${n8nBaseUrl}/user-profile?id=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`user-profile webhook returned ${res.status}`)
    const data = (await res.json()) as (User & { notFound?: boolean }) | { notFound: true }
    if ('notFound' in data && data.notFound) return undefined
    if (!data || typeof (data as User).id !== 'string') {
      throw new Error('user-profile webhook returned an unexpected shape (missing id)')
    }
    return data as User
  } catch (err) {
    console.error('getUserProfile: falling back to local mock data —', err)
    return mockUsers.find((u) => u.id === userId)
  }
}

// ---------------------------------------------------------------------------
// getCharities — organizations accepting clothing donations (Charity tab).
//
// GETs {N8N_BASE_URL}/charities. Falls back to the local mock data if
// VITE_N8N_BASE_URL isn't set or the request fails.
// ---------------------------------------------------------------------------
export async function getCharities(): Promise<CharityOrg[]> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined

  if (!n8nBaseUrl) {
    await wait(300)
    return mockCharities
  }

  try {
    const res = await fetch(`${n8nBaseUrl}/charities`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`charities webhook returned ${res.status}`)
    const data = (await res.json()) as { charities: CharityOrg[] }
    if (!data || !Array.isArray(data.charities)) {
      throw new Error('charities webhook returned an unexpected shape (missing charities[])')
    }
    return data.charities
  } catch (err) {
    console.error('getCharities: falling back to local mock data —', err)
    return mockCharities
  }
}

// ---------------------------------------------------------------------------
// addCharity — admin-only. Server-side (n8n) enforces that only the admin
// Telegram username may add an organization. No local mock fallback (same
// reasoning as subscribe/unsubscribe — a fake local addition can't actually
// persist for other users), so this surfaces the error to the caller if the
// backend isn't reachable or there's no real Telegram session.
// ---------------------------------------------------------------------------
export async function addCharity(data: {
  name: string
  description: string
  linkUrl: string
  logoUrl: string
}): Promise<CharityOrg> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    throw new Error('Backend not configured — adding a charity requires a real Telegram session')
  }

  const res = await fetch(`${n8nBaseUrl}/add-charity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: rawInitData, charity: data }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`add-charity webhook returned ${res.status}`)
  const created = (await res.json()) as CharityOrg
  if (!created || typeof created.id !== 'string') {
    throw new Error('add-charity webhook returned an unexpected shape (missing id)')
  }
  return created
}

// ---------------------------------------------------------------------------
// uploadImage — uploads directly to Cloudinary using an unsigned preset, so
// no backend round-trip is needed for the file bytes themselves. Returns
// the permanent hosted URL (secure_url) to store on the item. Falls back to
// a local object URL (temporary, browser-only) if the upload fails, so the
// Upload screen still works for a quick local preview even if Cloudinary is
// unreachable — but a fallback item's photo won't survive a reload/won't
// show for other users, so failures are logged loudly.
// ---------------------------------------------------------------------------
const CLOUDINARY_CLOUD_NAME = 'aqwuexfd'
const CLOUDINARY_UPLOAD_PRESET = 'platform_unsigned'

export async function uploadImage(file: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error(`Cloudinary upload returned ${res.status}`)
    const data = (await res.json()) as { secure_url: string }
    if (!data || typeof data.secure_url !== 'string') {
      throw new Error('Cloudinary upload returned an unexpected shape (missing secure_url)')
    }
    return data.secure_url
  } catch (err) {
    console.error('uploadImage: Cloudinary upload failed, using a temporary local preview URL —', err)
    return URL.createObjectURL(file)
  }
}

// ---------------------------------------------------------------------------
// deleteListing — remove a listing. Server-side (n8n) enforces that only
// the item's own seller OR the hardcoded admin Telegram username may do
// this — the client never decides authorization on its own.
//
// Deliberately does NOT fall back to a silent local-only delete if the real
// request fails — a delete is destructive/authoritative, so callers should
// see the failure (they already do: ItemDetailScreen catches this and shows
// an alert) rather than the item quietly reappearing for everyone else.
// ---------------------------------------------------------------------------
export async function deleteListing(id: string): Promise<void> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    store.items = store.items.filter((i) => i.id !== id)
    saveStore(store)
    return
  }

  const res = await fetch(`${n8nBaseUrl}/delete-listing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: rawInitData, itemId: id }),
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`delete-listing webhook returned ${res.status}`)
  }
}

// ---------------------------------------------------------------------------
// markAsSold — toggle sold state on one of the current user's own items.
// ---------------------------------------------------------------------------
export async function markAsSold(id: string, sold = true): Promise<void> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    await wait(200)
    const item = store.items.find((i) => i.id === id)
    if (item) item.sold = sold
    saveStore(store)
    return
  }

  const res = await fetch(`${n8nBaseUrl}/mark-sold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: rawInitData, itemId: id, sold }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`mark-sold webhook returned ${res.status}`)
}

// ---------------------------------------------------------------------------
// updateListing — edit an existing item. Server-side (n8n) enforces that
// only the item's own seller may edit it (unlike delete, admins can't edit
// someone else's listing content — that's a moderation vs. authorship
// distinction).
// ---------------------------------------------------------------------------
export async function updateListing(id: string, data: CreateListingInput): Promise<Item> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    const item = store.items.find((i) => i.id === id)
    if (!item) throw new Error('Item not found')
    Object.assign(item, {
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      gender: data.gender,
      size: data.size,
      brand: data.brand,
      condition: data.condition,
      color: data.color,
      price: data.price,
      images: data.images.length ? data.images : item.images,
    })
    saveStore(store)
    return item
  }

  const res = await fetch(`${n8nBaseUrl}/edit-listing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: rawInitData, itemId: id, item: data }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`edit-listing webhook returned ${res.status}`)
  const updated = (await res.json()) as Item
  if (!updated || typeof updated.id !== 'string') {
    throw new Error('edit-listing webhook returned an unexpected shape (missing id)')
  }
  return updated
}

// Known filter facets, surfaced for building the filter sheet UI.
export const FACETS = {
  genders: ['Мужской', 'Женский', 'Унисекс', 'Дети'] as const,

  conditions: [
    'Новая с биркой',
    'Новая без бирки',
    'Есть дефекты',
    'Ношеная один раз',
    'Носилась часто',
  ] as const,

  categories: ['Обувь', 'Верхняя одежда', 'Верх', 'Низ', 'Аксессуары', 'Собаки', 'Дети'] as const,

  // Categories where gender/size don't apply the same way as clothing —
  // the Upload form relaxes those two fields for these.
  categoriesWithoutGender: ['Собаки', 'Дети'] as const,

  // Subcategory options depend on the selected Category.
  subcategoriesByCategory: {
    Обувь: ['Кроссовки', 'Ботинки', 'Кеды', 'Сандалии', 'Сланцы', 'Туфли', 'Другое'],
    'Верхняя одежда': [
      'Бомберы',
      'Джинсовые куртки',
      'Анораки',
      'Парки',
      'Ветровки',
      'Пиджаки',
      'Пальто',
      'Кожаные куртки',
      'Плащи',
      'Жилеты',
      'Куртки',
      'Другое',
    ],
    Верх: [
      'Свитера',
      'Кардиганы',
      'Свитшоты',
      'Олимпийки',
      'Рубашки',
      'Лонгсливы',
      'Поло',
      'Футболки',
      'Худи',
      'Платья',
      'Костюмы',
      'Майки',
      'Другое',
    ],
    Низ: ['Джинсы', 'Брюки', 'Шорты', 'Спортивные штаны', 'Плавки', 'Юбки', 'Другое'],
    Аксессуары: [
      'Наручные часы',
      'Шапки',
      'Шарфы',
      'Панамы',
      'Кепки',
      'Ремни',
      'Нижнее бельё',
      'Носки',
      'Солнцезащитные очки',
      'Сумки',
      'Рюкзаки',
      'Кошельки',
      'Другое',
    ],
    Собаки: [
      'Поводки',
      'Ошейники',
      'Шлейки',
      'Одежда для собак',
      'Игрушки',
      'Корм',
      'Лакомства',
      'Миски',
      'Лежанки и домики',
      'Переноски',
      'Когти и уход',
      'Аксессуары',
      'Другое',
    ],
    Дети: [
      'Одежда',
      'Обувь',
      'Слюнявчики',
      'Игрушки',
      'Коляски',
      'Автокресла',
      'Кроватки и манежи',
      'Соски и бутылочки',
      'Гигиена и уход',
      'Книги и развитие',
      'Аксессуары',
      'Другое',
    ],
  } as Record<Category, string[]>,

  // Size options depend on category — shoe sizing and clothing sizing don't
  // mix well in one flat list. sizes below is the master/combined list, used
  // when no category is selected yet (e.g. the filter sheet before a
  // category is chosen).
  sizesByCategory: {
    Обувь: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
    'Верхняя одежда': ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    Верх: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    Низ: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    Аксессуары: ['Один размер'],
    Собаки: ['XS', 'S', 'M', 'L', 'XL', 'Универсальный'],
    Дети: [
      '0-3 мес',
      '3-6 мес',
      '6-9 мес',
      '9-12 мес',
      '1-2 года',
      '2-3 года',
      '3-4 года',
      '4-5 лет',
      '5-6 лет',
      '6-7 лет',
      'Универсальный',
    ],
  } as Record<Category, string[]>,

  sizes: [
    'XXS',
    'XS',
    'S',
    'M',
    'L',
    'XL',
    'XXL',
    'XXXL',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
    'Один размер',
  ],

  colors: [
    { name: 'Чёрный', hex: '#111111' },
    { name: 'Белый', hex: '#FFFFFF' },
    { name: 'Серый', hex: '#9CA3AF' },
    { name: 'Бежевый', hex: '#E4D4B4' },
    { name: 'Коричневый', hex: '#7B4B2A' },
    { name: 'Синий', hex: '#2563EB' },
    { name: 'Зелёный', hex: '#00B248' },
    { name: 'Жёлтый', hex: '#FACC15' },
    { name: 'Золотой', hex: '#D4AF37' },
  ],

  brands: ["Levi's", 'Nike', 'Coach', 'Zara', 'Hunter', 'Mejuri', 'H&M', 'Uniqlo', 'Muji', 'Adidas'],

  minPrice: 100,
  maxPrice: 500000,
}

// ---------------------------------------------------------------------------
// Subscriptions — "notify me" saved filters, matched every few days by a
// scheduled n8n workflow against newly created listings. No local mock
// fallback here (there's nothing meaningful to fall back to — a fake local
// "subscription" can never actually trigger a real notification), so these
// simply surface the error to the caller if the backend isn't reachable.
// ---------------------------------------------------------------------------

export async function getSubscriptions(): Promise<Subscription[]> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) return []

  try {
    const res = await fetch(`${n8nBaseUrl}/subscriptions?initData=${encodeURIComponent(rawInitData)}`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`subscriptions webhook returned ${res.status}`)
    const data = (await res.json()) as { subscriptions: Subscription[] }
    if (!data || !Array.isArray(data.subscriptions)) {
      throw new Error('subscriptions webhook returned an unexpected shape (missing subscriptions[])')
    }
    return data.subscriptions
  } catch (err) {
    console.error('getSubscriptions: returning empty list —', err)
    return []
  }
}

export async function subscribe(filters: {
  category?: Category | null
  gender?: Gender | null
  size?: string | null
}): Promise<Subscription> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    throw new Error('Backend not configured — subscribe requires a real Telegram session')
  }

  const res = await fetch(`${n8nBaseUrl}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      initData: rawInitData,
      category: filters.category ?? null,
      gender: filters.gender ?? null,
      size: filters.size ?? null,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`subscribe webhook returned ${res.status}`)
  const data = (await res.json()) as Subscription
  if (!data || typeof data.id !== 'string') {
    throw new Error('subscribe webhook returned an unexpected shape (missing id)')
  }
  return data
}

export async function unsubscribe(subscriptionId: string): Promise<void> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    throw new Error('Backend not configured — unsubscribe requires a real Telegram session')
  }

  const res = await fetch(`${n8nBaseUrl}/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: rawInitData, subscriptionId }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`unsubscribe webhook returned ${res.status}`)
}

// ---------------------------------------------------------------------------
// searchBrands — autocomplete against the growing, crowd-sourced `brands`
// table in Supabase. Falls back to the small static FACETS.brands list
// (filtered client-side) if VITE_N8N_BASE_URL isn't set or the request
// fails, so the brand picker never breaks even without a backend.
// ---------------------------------------------------------------------------
export async function searchBrands(query: string): Promise<string[]> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined

  if (!n8nBaseUrl) {
    return FACETS.brands.filter((b) => b.toLowerCase().includes(query.toLowerCase()))
  }

  try {
    const res = await fetch(`${n8nBaseUrl}/brands?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`brands webhook returned ${res.status}`)
    const data = (await res.json()) as { brands: string[] }
    if (!data || !Array.isArray(data.brands)) {
      throw new Error('brands webhook returned an unexpected shape (missing brands[])')
    }
    return data.brands
  } catch (err) {
    console.error('searchBrands: falling back to local static list —', err)
    return FACETS.brands.filter((b) => b.toLowerCase().includes(query.toLowerCase()))
  }
}

// ---------------------------------------------------------------------------
// trackMessageClick — fire-and-forget analytics ping when someone taps
// "Написать продавцу". No auth required (it's a non-sensitive counter), and
// failures are swallowed silently — this must never block or break the
// actual "open Telegram DM" action it accompanies.
// ---------------------------------------------------------------------------
export function trackMessageClick(itemId: string): void {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  if (!n8nBaseUrl) return
  fetch(`${n8nBaseUrl}/track-message-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
    cache: 'no-store',
  }).catch((err) => console.error('trackMessageClick failed (non-blocking) —', err))
}

// ---------------------------------------------------------------------------
// getAdminStats — aggregate, name-free platform stats for the admin screen.
// Server-side (n8n) enforces that only the admin Telegram username can call
// this at all.
// ---------------------------------------------------------------------------
export interface DayCount {
  date: string
  count: number
}

export interface AdminStats {
  totalUsers: number
  totalActiveListings: number
  totalSoldItems: number
  totalMessageClicks: number
  signupsLast7Days: DayCount[]
  listingsLast7Days: DayCount[]
}

export async function getAdminStats(): Promise<AdminStats> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    throw new Error('Backend not configured — admin stats requires a real Telegram session')
  }

  const res = await fetch(`${n8nBaseUrl}/admin-stats?initData=${encodeURIComponent(rawInitData)}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`admin-stats webhook returned ${res.status}`)
  const data = (await res.json()) as AdminStats
  if (!data || typeof data.totalUsers !== 'number') {
    throw new Error('admin-stats webhook returned an unexpected shape (missing totalUsers)')
  }
  return data
}

// ---------------------------------------------------------------------------
// Moderation (admin-only) — flagged listings queue. Server-side (n8n)
// enforces that only the admin Telegram username can call these.
// ---------------------------------------------------------------------------
export interface FlaggedItem {
  id: string
  title: string
  price: number
  currency: string
  images: string[]
  description: string
  sellerId: string
  sellerName: string | null
  sellerUsername: string | null
  createdAt: string
}

export async function getFlaggedListings(): Promise<FlaggedItem[]> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    throw new Error('Backend not configured — this requires a real Telegram session')
  }

  const res = await fetch(`${n8nBaseUrl}/flagged-listings?initData=${encodeURIComponent(rawInitData)}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`flagged-listings webhook returned ${res.status}`)
  const data = (await res.json()) as { items: FlaggedItem[] }
  if (!data || !Array.isArray(data.items)) {
    throw new Error('flagged-listings webhook returned an unexpected shape (missing items[])')
  }
  return data.items
}

export async function moderateListing(itemId: string, action: 'approve' | 'ban'): Promise<void> {
  const n8nBaseUrl = import.meta.env.VITE_N8N_BASE_URL as string | undefined
  const rawInitData = telegram.getRawInitData()

  if (!n8nBaseUrl || !rawInitData) {
    throw new Error('Backend not configured — this requires a real Telegram session')
  }

  const res = await fetch(`${n8nBaseUrl}/moderate-listing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: rawInitData, itemId, action }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`moderate-listing webhook returned ${res.status}`)
}
