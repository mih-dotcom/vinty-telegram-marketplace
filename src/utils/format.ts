export function formatPrice(price: number, currency = '₽'): string {
  return `${price.toLocaleString('ru-RU')} ${currency}`
}

/** Приветствие по времени суток для главного экрана, напр. «Доброе утро». */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function formatMemberSince(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} дн назад`
  const months = Math.floor(days / 30)
  return `${months} мес назад`
}
