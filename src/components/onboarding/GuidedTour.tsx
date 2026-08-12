import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TOUR_STEPS } from '../../onboarding/tourSteps'

const SEEN_KEY = 'platforma_tour_seen_v1'

export function GuidedTour() {
  const navigate = useNavigate()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  // Start the tour once, on the very first launch — after the app's own
  // "force home on launch" redirect has already settled.
  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY)
    if (!seen) {
      setActive(true)
      setStepIndex(0)
      navigate(TOUR_STEPS[0].route)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finish = () => {
    localStorage.setItem(SEEN_KEY, '1')
    setActive(false)
    navigate('/')
  }

  const handleContinue = () => {
    const next = stepIndex + 1
    if (next >= TOUR_STEPS.length) {
      finish()
      return
    }
    setStepIndex(next)
    navigate(TOUR_STEPS[next].route)
  }

  if (!active) return null

  const step = TOUR_STEPS[stepIndex]
  const isLast = stepIndex === TOUR_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop — dims and blocks interaction with the real screen behind,
          so attention stays on the explanation card while still letting the
          person see which real tab/screen is being described. */}
      <div className="absolute inset-0" style={{ background: 'rgba(5,10,8,0.55)' }} />

      <div className="absolute bottom-0 left-0 right-0 safe-bottom px-4 pb-4 flex justify-center">
        <div
          className="w-full max-w-[480px] rounded-card px-5 py-5 shadow-glass-lg"
          style={{ background: 'var(--surface)' }}
        >
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-3">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-pill transition-all"
                style={{
                  width: i === stepIndex ? 20 : 6,
                  background: i === stepIndex ? 'var(--color-primary-green)' : 'var(--surface-border)',
                }}
              />
            ))}
          </div>

          <h2 className="text-[18px] font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
            {step.title}
          </h2>
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            {step.description}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={finish}
              className="text-[14px] font-semibold press-spring"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Пропустить
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 cta-gradient text-white font-bold text-[15px] rounded-pill py-3 press-spring shadow-glass"
            >
              {isLast ? 'Начать пользоваться' : 'Продолжить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
