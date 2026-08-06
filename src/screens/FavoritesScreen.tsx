import { useEffect, useState } from 'react'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { ItemGrid } from '../components/item/ItemGrid'
import { getFavoriteItems } from '../services/api'
import type { Item } from '../types'
import { useApp } from '../context/AppContext'

export function FavoritesScreen() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const { favoriteIds } = useApp()

  useEffect(() => {
    setLoading(true)
    getFavoriteItems().then((res) => {
      setItems(res)
      setLoading(false)
    })
  }, [favoriteIds])

  return (
    <div className="pb-28">
      <ScreenHeader title="Favorites" sticky={false} />
      <main className="px-4 pt-4">
        <ItemGrid items={items} loading={loading} emptyLabel="No favorites yet — tap the heart on any item to save it here." />
      </main>
    </div>
  )
}
