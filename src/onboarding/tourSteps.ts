export interface TourStep {
  route: string
  title: string
  description: string
}

// Each step navigates the real app to `route` while an explanatory card
// floats above it — an actual guided tour through the real screens, not a
// static slideshow. Keep this list in sync with real navigation targets.
export const TOUR_STEPS: TourStep[] = [
  {
    route: '/',
    title: 'Добро пожаловать 👋',
    description:
      'Это лента — здесь вся одежда, которую продают соседи по посёлку. Листайте вещи, переключайте категории сверху и пользуйтесь быстрыми фильтрами вроде «Новое» и «Недорого».',
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
