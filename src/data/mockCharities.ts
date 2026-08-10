import type { CharityOrg } from '../types'

// Вымышленные организации для прототипа — не реальные благотворительные фонды.
const logo = (seed: string) => `https://i.pravatar.cc/150?u=charity-${seed}`

export const mockCharities: CharityOrg[] = [
  {
    id: 'c1',
    name: 'Фонд «Вторая жизнь»',
    logoUrl: logo('rewear'),
    description:
      'Собирает вещи в хорошем состоянии и передаёт их нуждающимся семьям по всему городу. Пункты приёма есть в 12 точках.',
    location: 'Центр городской общины',
    acceptedItems: ['Одежда', 'Обувь', 'Сумки'],
    websiteUrl: 'https://example.org/rewear',
  },
  {
    id: 'c2',
    name: 'Шкаф второго шанса',
    logoUrl: logo('secondchance'),
    description:
      'Бесплатно предоставляет деловую одежду людям, готовящимся к собеседованиям. Особенно нужны пиджаки и деловые вещи.',
    location: 'Речной район',
    acceptedItems: ['Деловая одежда', 'Обувь', 'Аксессуары'],
    websiteUrl: 'https://example.org/second-chance-closet',
  },
  {
    id: 'c3',
    name: 'Тёплые руки',
    logoUrl: logo('warmhands'),
    description:
      'Сезонный сбор тёплой одежды — пальто, свитеров и обуви для приютов перед наступлением холодов.',
    location: 'Сеть приютов Северного района',
    acceptedItems: ['Пальто', 'Свитеры', 'Ботинки'],
    websiteUrl: 'https://example.org/warm-hands',
  },
  {
    id: 'c4',
    name: 'Маленькие нити',
    logoUrl: logo('littlethreads'),
    description:
      'Занимается детской одеждой — собирает вещи, из которых дети выросли, и передаёт их семьям через местные школы.',
    location: 'Семейный центр Восточного района',
    acceptedItems: ['Детская одежда', 'Обувь', 'Игрушки'],
    websiteUrl: 'https://example.org/little-threads',
  },
  {
    id: 'c5',
    name: 'Зелёный гардероб',
    logoUrl: logo('greencloset'),
    description:
      'Спасает текстиль от свалок: сортирует, чинит и передаёт вещи дальше, а то, что нельзя использовать повторно — перерабатывает.',
    location: 'Пункт переработки «Вестпорт»',
    acceptedItems: ['Одежда', 'Сумки', 'Обрезки ткани'],
    websiteUrl: 'https://example.org/green-closet',
  },
]
