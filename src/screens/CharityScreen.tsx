import { useEffect, useState } from 'react'
import { ExternalLink, Plus } from 'lucide-react'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { GlassCard } from '../components/common/GlassCard'
import { Sheet } from '../components/layout/Sheet'
import { Spinner, ProgressRing } from '../components/common/ProgressRing'
import { getCharities, addCharity, uploadImage } from '../services/api'
import type { CharityOrg } from '../types'
import { telegram } from '../services/telegram'
import { useApp } from '../context/AppContext'

export function CharityScreen() {
  const { isAdmin } = useApp()
  const [charities, setCharities] = useState<CharityOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  const load = () => {
    setLoading(true)
    getCharities().then((res) => {
      setCharities(res)
      setLoading(false)
    })
  }

  useEffect(load, [])

  const handleVisit = (org: CharityOrg) => {
    if (org.linkUrl) {
      window.open(org.linkUrl, '_blank', 'noopener,noreferrer')
    } else {
      telegram.showAlert('У этой организации пока нет ссылки.')
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

        {isAdmin && (
          <button
            onClick={() => setAddOpen(true)}
            className="mb-4 w-full flex items-center justify-center gap-1.5 rounded-pill py-3 text-[13.5px] font-bold press-spring"
            style={{ background: 'var(--color-primary-green)', color: '#fff' }}
          >
            <Plus size={16} />
            Добавить организацию
          </button>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : charities.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Пока пусто
            </p>
            <p className="text-[13px] max-w-[240px]" style={{ color: 'var(--text-tertiary)' }}>
              Организации, принимающие пожертвования, появятся здесь.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {charities.map((org) => (
              <GlassCard key={org.id} className="p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
                      {org.name}
                    </h3>
                    <p className="text-[13px] leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {org.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleVisit(org)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-pill py-2.5 text-[13px] font-semibold press-spring"
                  style={{ background: 'var(--color-primary-green)', color: '#fff' }}
                >
                  Перейти по ссылке
                  <ExternalLink size={14} />
                </button>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <AddCharitySheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function AddCharitySheet({
  open,
  onClose,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  onAdded: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setName('')
    setDescription('')
    setLinkUrl('')
    setLogoUrl('')
  }

  const handlePickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const url = await uploadImage(file)
      setLogoUrl(url)
    } finally {
      setUploadingLogo(false)
    }
  }

  const canSubmit = name.trim() && description.trim() && linkUrl.trim() && logoUrl && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await addCharity({
        name: name.trim(),
        description: description.trim(),
        linkUrl: linkUrl.trim(),
        logoUrl,
      })
      telegram.hapticNotification('success')
      reset()
      onAdded()
    } catch (err) {
      console.error('Failed to add charity —', err)
      telegram.showAlert('Не удалось добавить организацию. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Новая организация">
      <div className="flex flex-col gap-4">
        {/* Квадратная аватарка */}
        <div className="flex flex-col items-center gap-2">
          <label className="relative w-24 h-24 rounded-2xl overflow-hidden glass flex items-center justify-center cursor-pointer">
            {logoUrl ? (
              <img src={logoUrl} alt="Логотип" className="w-full h-full object-cover" />
            ) : uploadingLogo ? (
              <ProgressRing progress={0.6} size={22} />
            ) : (
              <Plus size={22} style={{ color: 'var(--text-tertiary)' }} />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePickLogo}
            />
          </label>
          <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            Квадратная аватарка
          </span>
        </div>

        <div className="glass rounded-2xl px-4 py-3">
          <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Название
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Фонд «Вторая жизнь»"
            className="w-full bg-transparent outline-none text-[14px] mt-1 placeholder:opacity-50"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <div className="glass rounded-2xl px-4 py-3">
          <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Краткое описание
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Чем занимается, что принимает..."
            rows={3}
            className="w-full bg-transparent outline-none text-[14px] mt-1 resize-none placeholder:opacity-50"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <div className="glass rounded-2xl px-4 py-3">
          <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Ссылка
          </label>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-transparent outline-none text-[14px] mt-1 placeholder:opacity-50"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-pill py-3 font-bold text-[14.5px] press-spring disabled:opacity-50"
          style={{ background: 'var(--color-primary-green)', color: '#fff' }}
        >
          {submitting ? 'Добавляем...' : 'Добавить'}
        </button>
      </div>
    </Sheet>
  )
}
