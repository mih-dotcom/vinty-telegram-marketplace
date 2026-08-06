import { useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ChevronRight, GripVertical, X } from 'lucide-react'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { Sheet } from '../components/layout/Sheet'
import { ChipSelect } from '../components/filters/ChipSelect'
import { ProgressRing } from '../components/common/ProgressRing'
import { createListing, uploadImage, FACETS } from '../services/api'
import type { Category, Condition } from '../types'
import { telegram } from '../services/telegram'
import { useMainButton } from '../hooks/useTelegram'

interface Photo {
  id: string
  url: string
  uploading: boolean
}

const CATEGORIES: Category[] = ['Women', 'Men', 'Kids', 'Shoes', 'Bags', 'Accessories']

export function UploadScreen() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragIndex = useRef<number | null>(null)

  const [photos, setPhotos] = useState<Photo[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [size, setSize] = useState('')
  const [brand, setBrand] = useState('')
  const [brandFocused, setBrandFocused] = useState(false)
  const [condition, setCondition] = useState<Condition | ''>('')
  const [price, setPrice] = useState('')

  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  const canSubmit =
    photos.length > 0 &&
    title.trim().length > 0 &&
    category !== '' &&
    size !== '' &&
    brand.trim().length > 0 &&
    condition !== '' &&
    Number(price) > 0 &&
    !submitting

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newPhotos: Photo[] = Array.from(files).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      url: '',
      uploading: true,
    }))
    setPhotos((prev) => [...prev, ...newPhotos])

    await Promise.all(
      Array.from(files).map(async (file, i) => {
        const url = await uploadImage(file) // TODO(n8n): replace with real upload endpoint
        setPhotos((prev) =>
          prev.map((p) => (p.id === newPhotos[i].id ? { ...p, url, uploading: false } : p))
        )
      })
    )
  }

  const removePhoto = (id: string) => setPhotos((prev) => prev.filter((p) => p.id !== id))

  const onDragStart = (index: number) => {
    dragIndex.current = index
  }
  const onDragOver = (index: number, e: DragEvent) => {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return
    setPhotos((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex.current!, 1)
      next.splice(index, 0, moved)
      return next
    })
    dragIndex.current = index
  }
  const onDragEnd = () => {
    dragIndex.current = null
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      telegram.hapticNotification('error')
      telegram.showAlert('Please add at least one photo and fill in title, category, size, brand, condition and price.')
      return
    }
    setSubmitting(true)
    try {
      const item = await createListing({
        title: title.trim(),
        description: description.trim(),
        category: category as Category,
        size,
        brand: brand.trim(),
        condition: condition as Condition,
        price: Number(price),
        images: photos.filter((p) => p.url).map((p) => p.url),
      })
      telegram.hapticNotification('success')
      navigate(`/item/${item.id}`)
    } catch {
      telegram.hapticNotification('error')
      telegram.showAlert('Something went wrong creating your listing. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Wire Telegram's native MainButton to the same submit action.
  useMainButton(submitting ? 'Uploading...' : 'Upload listing', handleSubmit, {
    loading: submitting,
  })

  const filteredBrands = brand
    ? FACETS.brands.filter((b) => b.toLowerCase().includes(brand.toLowerCase()) && b !== brand)
    : []

  return (
    <div className="pb-40">
      <ScreenHeader title="Sell an item" />

      <div className="px-4 pt-4 flex flex-col gap-5">
        {/* Photo uploader */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Photos
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => onDragOver(i, e)}
                onDragEnd={onDragEnd}
                className="relative aspect-square rounded-2xl overflow-hidden glass"
              >
                {photo.uploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <ProgressRing progress={0.6} size={32} />
                  </div>
                ) : (
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                )}
                {i === 0 && !photo.uploading && (
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-pill">
                    Cover
                  </span>
                )}
                <button
                  onClick={() => removePhoto(photo.id)}
                  aria-label="Remove photo"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full glass-strong flex items-center justify-center press-spring"
                >
                  <X size={11} style={{ color: 'var(--text-primary)' }} />
                </button>
                <div className="absolute bottom-1 right-1 opacity-60">
                  <GripVertical size={12} className="text-white" />
                </div>
              </div>
            ))}

            {photos.length < 9 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 press-spring glass"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                <Camera size={20} style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Add photo
                </span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </section>

        {/* Title */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Title
          </h3>
          <div className="glass rounded-2xl px-4 py-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Oversized denim jacket"
              maxLength={80}
              className="w-full bg-transparent outline-none text-[15px] placeholder:opacity-50"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </section>

        {/* Description */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Description
          </h3>
          <div className="glass rounded-2xl px-4 py-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condition details, measurements, why you're selling..."
              rows={4}
              className="w-full bg-transparent outline-none text-[14px] resize-none placeholder:opacity-50"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </section>

        {/* Category */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Category
          </h3>
          <button
            onClick={() => setCategorySheetOpen(true)}
            className="glass rounded-2xl px-4 py-3 w-full flex items-center justify-between press-spring"
          >
            <span
              className="text-[15px]"
              style={{ color: category ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            >
              {category || 'Select category'}
            </span>
            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </section>

        {/* Size */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Size
          </h3>
          <button
            onClick={() => setSizeSheetOpen(true)}
            className="glass rounded-2xl px-4 py-3 w-full flex items-center justify-between press-spring"
          >
            <span className="text-[15px]" style={{ color: size ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              {size || 'Select size'}
            </span>
            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </section>

        {/* Brand autocomplete */}
        <section className="relative">
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Brand
          </h3>
          <div className="glass rounded-2xl px-4 py-3">
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              onFocus={() => setBrandFocused(true)}
              onBlur={() => setTimeout(() => setBrandFocused(false), 150)}
              placeholder="e.g. Nike, Zara..."
              className="w-full bg-transparent outline-none text-[15px] placeholder:opacity-50"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          {brandFocused && filteredBrands.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 glass-strong rounded-2xl overflow-hidden">
              {filteredBrands.slice(0, 5).map((b) => (
                <button
                  key={b}
                  onMouseDown={() => setBrand(b)}
                  className="w-full text-left px-4 py-2.5 text-[14px]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Condition */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Condition
          </h3>
          <ChipSelect
            options={FACETS.conditions}
            selected={condition ? [condition] : []}
            onToggle={(v) => setCondition(v === condition ? '' : v)}
          />
        </section>

        {/* Price */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Price
          </h3>
          <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-[16px] font-bold" style={{ color: 'var(--color-primary-green)' }}>
              $
            </span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              inputMode="decimal"
              className="w-full bg-transparent outline-none text-[15px] placeholder:opacity-50"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </section>
      </div>

      {/* Category sheet */}
      <Sheet open={categorySheetOpen} onClose={() => setCategorySheetOpen(false)} title="Category">
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c)
                setCategorySheetOpen(false)
              }}
              className="glass rounded-2xl px-4 py-3 text-left press-spring text-[15px] font-medium"
              style={{ color: category === c ? 'var(--color-primary-green)' : 'var(--text-primary)' }}
            >
              {c}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Size sheet */}
      <Sheet open={sizeSheetOpen} onClose={() => setSizeSheetOpen(false)} title="Size">
        <ChipSelect
          options={FACETS.sizes}
          selected={size ? [size] : []}
          onToggle={(v) => {
            setSize(v)
            setSizeSheetOpen(false)
          }}
        />
      </Sheet>

      {/* Fallback CTA for browsers outside Telegram, where MainButton isn't available.
          Sits above the persistent bottom nav rather than replacing it. */}
      {!telegram.isAvailable() && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center px-4 pointer-events-none z-40">
          <div className="w-full max-w-[560px] pointer-events-auto">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full cta-gradient text-white font-bold text-[15px] rounded-pill py-3.5 press-spring shadow-glass-lg disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting && <ProgressRing progress={0.7} size={18} />}
              {submitting ? 'Uploading...' : 'Upload listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
