import { useEffect, useRef, useState } from 'react'

/**
 * Lightweight pull-to-refresh gesture for the top-level page scroll.
 * Tracks a downward touch drag that starts while the page is scrolled to
 * the very top; crossing `threshold` on release triggers `onRefresh`.
 */
export function usePullToRefresh(onRefresh: () => void | Promise<void>, threshold = 64) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef<number | null>(null)
  const active = useRef(false)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY
        active.current = true
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || startY.current === null) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0) {
        setPullDistance(Math.min(delta * 0.5, threshold * 1.5))
      } else {
        active.current = false
        startY.current = null
        setPullDistance(0)
      }
    }
    const onTouchEnd = () => {
      if (!active.current) return
      active.current = false
      startY.current = null
      setPullDistance((d) => {
        if (d >= threshold) {
          setPulling(true)
          Promise.resolve(onRefreshRef.current()).finally(() => setPulling(false))
        }
        return 0
      })
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [threshold])

  return { pulling, pullDistance }
}
