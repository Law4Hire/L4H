import { useEffect, useRef, useCallback } from 'react'

interface UseIdleTimeoutOptions {
  onIdle: () => void
  idleTime?: number // in milliseconds
  enabled?: boolean
}

export function useIdleTimeout({ onIdle, idleTime = 20 * 60 * 1000, enabled = true }: UseIdleTimeoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const onIdleRef = useRef(onIdle)

  // Update ref when callback changes
  useEffect(() => {
    onIdleRef.current = onIdle
  }, [onIdle])

  const resetTimer = useCallback(() => {
    if (!enabled) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onIdleRef.current()
    }, idleTime)
  }, [idleTime, enabled])

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      return
    }

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer()
    }

    // Set initial timer
    resetTimer()

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity)
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [resetTimer, enabled])

  return { resetTimer }
}
