import React, { useState, useEffect, useRef } from 'react'
import { Play, Square, Clock } from 'lucide-react'
import { Button, useToast, fetchJson } from '@l4h/shared-ui'

interface TimeTrackerProps {
  caseId: string
  clientName: string
}

interface TimeEntry {
  id: number
  startTime: string
  duration: number
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ caseId, clientName }) => {
  const { success, error } = useToast()
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch active timer on mount
  useEffect(() => {
    checkActiveTimer()
    return () => stopTimerInterval()
  }, [])

  // Start/Stop interval based on activeEntry
  useEffect(() => {
    if (activeEntry) {
      const startTime = new Date(activeEntry.startTime).getTime()
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
      
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } else {
      stopTimerInterval()
      setElapsed(0)
    }
    return () => stopTimerInterval()
  }, [activeEntry])

  const stopTimerInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const checkActiveTimer = async () => {
    try {
      // We assume GET /active returns the active timer if any
      // Note: The backend currently returns the first active timer for the user.
      // We should check if it belongs to THIS case.
      const entry = await fetchJson<TimeEntry>('/v1/time-tracking/active')
      // If the backend supports CaseId in TimeEntry, we check it here.
      // For now, we assume if there's an active timer, we show it (global timer).
      // Or we can restrict to this caseId if the backend updates.
      setActiveEntry(entry)
    } catch (err) {
      // 404 means no active timer, which is fine
      setActiveEntry(null)
    }
  }

  const handleStart = async () => {
    if (!caseId) {
      error('No case selected')
      return
    }

    try {
      setIsLoading(true)
      console.log('Starting timer for case:', caseId)
      
      const entry = await fetchJson<TimeEntry>('/v1/time-tracking/start', {
        method: 'POST',
        body: JSON.stringify({
          caseId: caseId, 
          description: `Working on case for ${clientName}`
        })
      })
      setActiveEntry(entry)
      success('Time tracking started')
    } catch (err: any) {
      console.error('Timer start failed:', err)
      // Check if it's a "Timer already running" error
      if (err.message && err.message.includes('already running')) {
         error('A timer is already running. Stop it first.')
         // Optionally fetch the active timer to show it
         checkActiveTimer()
      } else {
         error(err.message || 'Failed to start timer')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    if (!activeEntry) return

    try {
      setIsLoading(true)
      await fetchJson(`/v1/time-tracking/stop/${activeEntry.id}`, {
        method: 'POST'
      })
      setActiveEntry(null)
      success('Time tracking stopped')
    } catch (err) {
      console.error(err)
      error('Failed to stop timer')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-4 bg-gray-100 dark:bg-navy-800 p-3 rounded-lg border border-gray-200 dark:border-navy-700">
      <div className="flex items-center gap-2">
        <Clock size={20} className={activeEntry ? "text-green-600 animate-pulse" : "text-gray-400"} />
        <span className="font-mono text-xl font-bold text-navy-900 dark:text-white">
          {formatTime(elapsed)}
        </span>
      </div>
      
      {activeEntry ? (
        <Button
          onClick={handleStop}
          variant="danger"
          size="sm"
          loading={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Square size={16} className="mr-2 fill-current" /> Stop
        </Button>
      ) : (
        <Button
          onClick={handleStart}
          variant="primary"
          size="sm"
          loading={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Play size={16} className="mr-2 fill-current" /> Start
        </Button>
      )}
    </div>
  )
}
