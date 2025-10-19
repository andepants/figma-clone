/**
 * Performance Metrics Hook
 *
 * Tracks FPS, frame time, and performance metrics for the canvas application.
 * Only active in development mode to avoid performance overhead in production.
 *
 * @example
 * ```tsx
 * function CanvasPage() {
 *   // Enable in dev mode only
 *   usePerformanceMetrics();
 *
 *   // Or enable manually for production debugging
 *   usePerformanceMetrics(true);
 *
 *   return <canvas />;
 * }
 * ```
 */

import { useEffect } from 'react'

/**
 * Performance monitoring hook
 *
 * Tracks FPS and provides warnings when performance degrades.
 * Uses requestAnimationFrame to measure actual frame rate.
 *
 * Thresholds:
 * - < 30 FPS: Warning (⚠️)
 * - < 50 FPS: Info (📊)
 * - >= 50 FPS: Good (✅)
 *
 * @param enabled - Enable performance monitoring (default: DEV mode only)
 */
export function usePerformanceMetrics(enabled = import.meta.env.DEV) {
  useEffect(() => {
    if (!enabled) return

    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number

    /**
     * Measure frame rate by counting frames per second
     */
    const measureFrame = () => {
      frameCount++
      const currentTime = performance.now()
      const delta = currentTime - lastTime

      // Log FPS every second
      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta)

        if (fps < 30) {
          console.warn(`⚠️ Low FPS: ${fps}`)
        } else if (fps < 50) {
          console.log(`📊 FPS: ${fps}`)
        } else {
          console.log(`✅ FPS: ${fps}`)
        }

        frameCount = 0
        lastTime = currentTime
      }

      rafId = requestAnimationFrame(measureFrame)
    }

    rafId = requestAnimationFrame(measureFrame)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [enabled])
}
