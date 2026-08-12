export interface TourStep {
  /** Static route — used for most steps. */
  route?: string
  /** For steps that need a real record to navigate to (e.g. an item
   * detail page) — resolves the route at tour-time, or null to skip
   * this step entirely (e.g. no items exist yet). */
  resolveRoute?: () => Promise<string | null>
  title: string
  description: string
}

// Each step navigates the real app to its route while an explanatory card
// floats above it — an actual guided tour through the real screens, not a
// static slideshow. Keep this list in sync with real navigation targets.
export const TOUR_STEPS: TourStep[] = [
  {
    route: '/',
    title: 'Добро пожаловать 👋',
    description:
      'Это лента — здесь вся одежда, которую продают люди рядом с вами. Листайте вещи, переключайте категории сверху и пользуйтесь быстрыми фильтрами вроде «Новое» и «Недорого».',
  },
  {
    resolveRoute: async () => {
      const { getItems } = await import('../services/api')
      const res = await getItems({ pageSize: 1 })
      return res.items[0] ? `/item/${res.items[0].id}` : null
    },
    title: 'Карточка товара',
    description:
      'Откройте вещь, чтобы увидеть все фото и подробности. Кнопка «Написать продавцу» откроет настоящую переписку прямо в Telegram — там и договаривайтесь о встрече и цене.',
  },
  {
    route: '/search',
    title: 'Поиск',
    description:
      'Если ищете что-то конкретное — переходите сюда. А иконка со слайдерами в ленте откроет полные фильтры: пол, размер, бренд, цена и состояние.',
  },
  {
    route: '/sell',
    title: 'Продать вещь',
    description:
      'Нажмите «+» внизу в любой момент. Добавьте фото с камеры или из галереи, заполните пару полей — и объявление опубликовано.',
  },
  {
    route: '/profile',
    title: 'Ваш профиль',
    description:
      'Здесь — ваши объявления, избранное и проданные вещи. Можно редактировать или удалять объявления, а через шестерёнку — настроить уведомления о новых вещах, которые могут вам понравиться.',
  },
]
