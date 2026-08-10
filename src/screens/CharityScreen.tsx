import { useEffect, useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { GlassCard } from '../components/common/GlassCard'
import { Avatar } from '../components/common/Avatar'
import { InfoChip } from '../components/common/ConditionBadge'
import { Spinner } from '../components/common/ProgressRing'
import { getCharities } from '../services/api'
import type { CharityOrg } from '../types'
import { telegram } from '../services/telegram'

export function CharityScreen() {
  const [charities, setCharities] = useState<CharityOrg[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCharities().then((res) => {
      setCharities(res)
      setLoading(false)
    })
  }, [])

  const handleVisit = (org: CharityOrg) => {
    if (org.websiteUrl) {
      window.open(org.websiteUrl, '_blank', 'noopener,noreferrer')
    } else {
      telegram.showAlert('У этой организации пока нет сайта.')
    }
  }

  return (
    <div className="pb-28">
      <ScreenHeader title="Добро" sticky={false} />

      <div className="px-4 pt-1">
        <p className="text-[14px] mb-4" style={{ color: 'var(--text-secondary)' }}>
          Подарите ненужным вещам вторую жизнь — эти организации принимают
          пожертвования рядом с вами.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {charities.map((org) => (
              <GlassCard key={org.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar src={org.logoUrl} name={org.name} size={48} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
                      {org.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={12} style={{ color: 'var(--text-tertiary)' }} />
                      <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                        {org.location}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[13px] leading-relaxed mt-3" style={{ color: 'var(--text-secondary)' }}>
                  {org.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {org.acceptedItems.map((item) => (
                    <InfoChip key={item} label={item} />
                  ))}
                </div>

                <button
                  onClick={() => handleVisit(org)}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-pill py-2.5 text-[13px] font-semibold press-spring"
                  style={{ background: 'var(--color-primary-green)', color: '#fff' }}
                >
                  Перейти на сайт
                  <ExternalLink size={14} />
                </button>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
