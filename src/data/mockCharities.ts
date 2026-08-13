import type { CharityOrg } from '../types'

// Вымышленные организации для прототипа (используются только как fallback,
// если бэкенд недоступен) — не реальные благотворительные фонды.
const logo = (seed: string) => `https://i.pravatar.cc/150?u=charity-${seed}`

export const mockCharities: CharityOrg[] = [
  {
    id: 'c1',
    name: 'Фонд «Вторая жизнь»',
    logoUrl: logo('rewear'),
    description:
      'Собирает вещи в хорошем состоянии и передаёт их нуждающимся семьям.',
    linkUrl: 'https://example.org/rewear',
  },
  {
    id: 'c2',
    name: 'Тёплые руки',
    logoUrl: logo('warmhands'),
    description:
      'Сезонный сбор тёплой одежды — пальто, свитеров и обуви для приютов перед наступлением холодов.',
    linkUrl: 'https://example.org/warm-hands',
  },
]
