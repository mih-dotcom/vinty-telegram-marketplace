import type { User } from '../types'

// Placeholder avatar images (deterministic via pravatar seed).
const avatar = (seed: string) => `https://i.pravatar.cc/150?u=${seed}`

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Мария Соколова',
    username: 'ariabloom',
    avatarUrl: avatar('aria'),
    rating: 4.8,
    ratingCount: 132,
    itemsSold: 87,
    itemsListed: 12,
    memberSince: '2022-03-14T00:00:00.000Z',
    followers: 340,
    following: 98,
  },
  {
    id: 'u2',
    name: 'Лев Морозов',
    username: 'leomarsh',
    avatarUrl: avatar('leo'),
    rating: 4.6,
    ratingCount: 64,
    itemsSold: 41,
    itemsListed: 6,
    memberSince: '2023-01-09T00:00:00.000Z',
    followers: 120,
    following: 55,
  },
  {
    id: 'u3',
    name: 'Нина Волкова',
    username: 'ninav',
    avatarUrl: avatar('nina'),
    rating: 5.0,
    ratingCount: 210,
    itemsSold: 156,
    itemsListed: 20,
    memberSince: '2021-07-22T00:00:00.000Z',
    followers: 890,
    following: 130,
  },
  {
    id: 'u4',
    name: 'Семён Егоров',
    username: 'samokafor',
    avatarUrl: avatar('sam'),
    rating: 4.3,
    ratingCount: 28,
    itemsSold: 15,
    itemsListed: 4,
    memberSince: '2024-02-01T00:00:00.000Z',
    followers: 44,
    following: 61,
  },
  // "me" — used as the fallback current user when not running inside Telegram.
  {
    id: 'me',
    name: 'Гость',
    username: 'you',
    avatarUrl: avatar('me'),
    rating: 4.9,
    ratingCount: 18,
    itemsSold: 9,
    itemsListed: 3,
    memberSince: '2024-11-05T00:00:00.000Z',
    followers: 12,
    following: 30,
  },
]

export const getUserById = (id: string): User | undefined =>
  mockUsers.find((u) => u.id === id)
