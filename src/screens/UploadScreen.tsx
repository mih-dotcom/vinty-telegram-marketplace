import { useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ChevronRight, GripVertical, X } from 'lucide-react'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { Sheet } from '../components/layout/Sheet'
import { ChipSelect } from '../components/filters/ChipSelect'
import { ProgressRing } from '../components/common/ProgressRing'
import { createListing, uploadImage, FACETS } from '../services/api'
import type { Category, Condition, Gender } from '../types'
import { telegram } from '../services/telegram'
import { useMainButton } from '../hooks/useTelegram'

interface Photo {
  id: string
  url: string
  uploading: boolean
}

export function UploadScreen() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragIndex = useRef<number | null>(null)

  const [photos, setPhotos] = useState<Photo[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [category, setCategory] = useState<Category | ''>('')
  const [subcategory, setSubcategory] = useState('')
  const [size, setSize] = useState('')
  const [brand, setBrand] = useState('')
  const [brandFocused, setBrandFocused] = useState(false)
  const [condition, setCondition] = useState<Condition | ''>('')
  const [price, setPrice] = useState('')

  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [subcategorySheetOpen, setSubcategorySheetOpen] = useState(false)
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  const subcategoryOptions = category ? FACETS.subcategoriesByCategory[category] : []
  const sizeOptions = category ? FACETS.sizesByCategory[category] : []

  const canSubmit =
    photos.length > 0 &&
    title.trim().length > 0 &&
    gender !== '' &&
    category !== '' &&
    subcategory !== '' &&
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
        const url = await uploadImage(file) // TODO(n8n): заменить на реальный upload-эндпоинт
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
      telegram.showAlert(
        'Добавьте хотя бы одно фото и заполните название, пол, категорию, подкатегорию, размер, бренд, состояние и цену.'
      )
      return
    }
    setSubmitting(true)
    try {
      const item = await createListing({
        title: title.trim(),
        description: description.trim(),
        gender: gender as Gender,
        category: category as Category,
        subcategory,
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
      telegram.showAlert('Не удалось создать объявление. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  // Привязываем нативную MainButton Telegram к тому же действию отправки.
  useMainButton(submitting ? 'Публикуем...' : 'Опубликовать объявление', handleSubmit, {
    loading: submitting,
  })

  const filteredBrands = brand
    ? FACETS.brands.filter((b) => b.toLowerCase().includes(brand.toLowerCase()) && b !== brand)
    : []

  return (
    <div className="pb-40">
      <ScreenHeader title="Продать вещь" />

      <div className="px-4 pt-4 flex flex-col gap-5">
        {/* Фото */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Фото
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
                    Обложка
                  </span>
                )}
                <button
                  onClick={() => removePhoto(photo.id)}
                  aria-label="Удалить фото"
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
                style={{ borderColor: 'var(--surface-border)' }}
              >
                <Camera size={20} style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Добавить фото
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

        {/* Название */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Название
          </h3>
          <div className="glass rounded-2xl px-4 py-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="например, оверсайз джинсовая куртка"
              maxLength={80}
              className="w-full bg-transparent outline-none text-[15px] placeholder:opacity-50"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </section>

        {/* Описание */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Описание
          </h3>
          <div className="glass rounded-2xl px-4 py-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Состояние, замеры, почему продаёте..."
              rows={4}
              className="w-full bg-transparent outline-none text-[14px] resize-none placeholder:opacity-50"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </section>

        {/* Пол */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Пол
          </h3>
          <ChipSelect
            options={FACETS.genders}
            selected={gender ? [gender] : []}
            onToggle={(v) => setGender(v === gender ? '' : v)}
          />
        </section>

        {/* Категория */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Категория
          </h3>
          <button
            onClick={() => setCategorySheetOpen(true)}
            className="glass rounded-2xl px-4 py-3 w-full flex items-center justify-between press-spring"
          >
            <span
              className="text-[15px]"
              style={{ color: category ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            >
              {category || 'Выберите категорию'}
            </span>
            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </section>

        {/* Подкатегория */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Подкатегория
          </h3>
          <button
            onClick={() => category && setSubcategorySheetOpen(true)}
            disabled={!category}
            className="glass rounded-2xl px-4 py-3 w-full flex items-center justify-between press-spring disabled:opacity-40"
          >
            <span
              className="text-[15px]"
              style={{ color: subcategory ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            >
              {subcategory || (category ? 'Выберите подкатегорию' : 'Сначала выберите категорию')}
            </span>
            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </section>

        {/* Размер */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Размер
          </h3>
          <button
            onClick={() => category && setSizeSheetOpen(true)}
            disabled={!category}
            className="glass rounded-2xl px-4 py-3 w-full flex items-center justify-between press-spring disabled:opacity-40"
          >
            <span className="text-[15px]" style={{ color: size ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              {size || (category ? 'Выберите размер' : 'Сначала выберите категорию')}
            </span>
            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </section>

        {/* Бренд с автодополнением */}
        <section className="relative">
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Бренд
          </h3>
          <div className="glass rounded-2xl px-4 py-3">
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              onFocus={() => setBrandFocused(true)}
              onBlur={() => setTimeout(() => setBrandFocused(false), 150)}
              placeholder="например, Nike, Zara..."
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

        {/* Состояние */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Состояние вещи
          </h3>
          <ChipSelect
            options={FACETS.conditions}
            selected={condition ? [condition] : []}
            onToggle={(v) => setCondition(v === condition ? '' : v)}
          />
        </section>

        {/* Цена */}
        <section>
          <h3 className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Цена
          </h3>
          <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              inputMode="numeric"
              className="w-full bg-transparent outline-none text-[15px] placeholder:opacity-50"
              style={{ color: 'var(--text-primary)' }}
            />
            <span className="text-[16px] font-bold" style={{ color: 'var(--color-primary-green)' }}>
              ₽
            </span>
          </div>
        </section>
      </div>

      {/* Лист выбора категории */}
      <Sheet open={categorySheetOpen} onClose={() => setCategorySheetOpen(false)} title="Категория">
        <div className="flex flex-col gap-2">
          {FACETS.categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c)
                setSubcategory('')
                setSize('')
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

      {/* Лист выбора подкатегории */}
      <Sheet open={subcategorySheetOpen} onClose={() => setSubcategorySheetOpen(false)} title="Подкатегория">
        <ChipSelect
          options={subcategoryOptions}
          selected={subcategory ? [subcategory] : []}
          onToggle={(v) => {
            setSubcategory(v)
            setSubcategorySheetOpen(false)
          }}
        />
      </Sheet>

      {/* Лист выбора размера */}
      <Sheet open={sizeSheetOpen} onClose={() => setSizeSheetOpen(false)} title="Размер">
        <ChipSelect
          options={sizeOptions}
          selected={size ? [size] : []}
          onToggle={(v) => {
            setSize(v)
            setSizeSheetOpen(false)
          }}
        />
      </Sheet>

      {/* Запасная кнопка для браузеров вне Telegram, где MainButton недоступна.
          Располагается над постоянной нижней навигацией, а не вместо неё. */}
      {!telegram.isAvailable() && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center px-4 pointer-events-none z-40">
          <div className="w-full max-w-[560px] pointer-events-auto">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full cta-gradient text-white font-bold text-[15px] rounded-pill py-3.5 press-spring shadow-glass-lg disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting && <ProgressRing progress={0.7} size={18} />}
              {submitting ? 'Публикуем...' : 'Опубликовать объявление'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
