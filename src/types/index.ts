// ─────────────────────────────────────────────────────────────────────────
// Core domain types shared across the whole app.
// Keep these in sync with whatever shape the future n8n webhooks return —
// the UI only ever imports these types, never inline object shapes, so
// swapping the data source later is a one-file change (see services/api.ts).
// ─────────────────────────────────────────────────────────────────────────

export type Gender = 'Мужской' | 'Женский' | 'Унисекс'

export type Category =
  | 'Одежда'
  | 'Обувь'
  | 'Аксессуары'
  | 'Питомцы'
  | 'Дети'
  | 'Электроника и бытовая техника'
  | 'Товары для дома и дачи'
  | 'Красота и здоровье'
  | 'Продукты питания'
  | 'Услуги репетиторов и поиск персонала'

// Subcategories depend on the selected Category — the full list per category
// lives in services/api.ts (FACETS.subcategoriesByCategory) rather than as a
// giant exhaustive union here, since it's really just a curated lookup table.
export type Subcategory = string

export type Condition =
  | 'Новая с биркой'
  | 'Новая без бирки'
  | 'Есть дефекты'
  | 'Ношеная один раз'
  | 'Носилась часто'

export interface Item {
  id: string
  title: string
  price: number
  currency: string
  images: string[]
  size: string
  brand: string
  condition: Condition | null
  category: Category
  subcategory: Subcategory
  gender: Gender | null
  color?: string
  sellerId: string
  description: string
  createdAt: string // ISO date string
  favorited?: boolean
  sold?: boolean
  flagged?: boolean
}

export interface User {
  id: string
  name: string
  username: string
  avatarUrl: string
  rating: number // 0-5
  ratingCount: number
  itemsSold: number
  itemsListed: number
  memberSince: string // ISO date string
  followers: number
  following: number
}

export interface ItemFilters {
  query?: string
  category?: Category | 'All'
  subcategories?: Subcategory[]
  genders?: Gender[]
  minPrice?: number
  maxPrice?: number
  sizes?: string[]
  conditions?: Condition[]
  brands?: string[]
  colors?: string[]
  // 'relevant' ("Trending") stays available for the Home quick-filter chip
  // even though the full filter sheet only surfaces the other three.
  sortBy?: 'newest' | 'price_low' | 'price_high' | 'relevant'
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

// Payload shape for creating a new listing from the Upload screen.
export interface CreateListingInput {
  title: string
  description: string
  category: Category
  subcategory: Subcategory
  gender: Gender | null
  size: string
  brand: string
  condition: Condition | null
  color?: string
  price: number
  images: string[] // local object URLs / base64 for the prototype
}

// An organization that accepts clothing donations, shown on the Charity tab.
export interface CharityOrg {
  id: string
  name: string
  logoUrl: string
  description: string
  linkUrl: string
}

// A saved "notify me" filter — the periodic digest matches new listings
// against these. `null` on any field means "any" (no filter on that field).
export interface Subscription {
  id: string
  category: Category | null
  gender: Gender | null
  size: string | null
}
