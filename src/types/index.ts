// ─────────────────────────────────────────────────────────────────────────
// Core domain types shared across the whole app.
// Keep these in sync with whatever shape the future n8n webhooks return —
// the UI only ever imports these types, never inline object shapes, so
// swapping the data source later is a one-file change (see services/api.ts).
// ─────────────────────────────────────────────────────────────────────────

export type Category =
  | 'Women'
  | 'Men'
  | 'Kids'
  | 'Shoes'
  | 'Bags'
  | 'Accessories'

export type Condition =
  | 'New with tags'
  | 'Very good'
  | 'Good'
  | 'Satisfactory'

export interface Item {
  id: string
  title: string
  price: number
  currency: string
  images: string[]
  size: string
  brand: string
  condition: Condition
  category: Category
  color?: string
  sellerId: string
  description: string
  createdAt: string // ISO date string
  favorited?: boolean
  sold?: boolean
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
  minPrice?: number
  maxPrice?: number
  sizes?: string[]
  conditions?: Condition[]
  brands?: string[]
  colors?: string[]
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
  size: string
  brand: string
  condition: Condition
  color?: string
  price: number
  images: string[] // local object URLs / base64 for the prototype
}
