import React, { useState, useEffect, useRef } from 'react'
import { Play, Clock } from 'lucide-react'
import { Button } from './Button'
import { useToast } from './Toast'
import { fetchJson } from '../api-client'

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
      const entry = await fetchJson<TimeEntry>('/v1/time-tracking/active')
      setActiveEntry(entry)
    } catch (err) {
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
      if (err.message && err.message.includes('already running')) {
         error('A timer is already running. Stop it first.')
         checkActiveTimer()
      } else {
         error(`Failed to start timer: ${err.message || 'Unknown error'}`)
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
    <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <Clock size={20} className={activeEntry ? "text-green-600 animate-pulse" : "text-gray-400"} />
        <span className="font-mono text-xl font-bold text-gray-900 dark:text-white">
          {formatTime(elapsed)}
        </span>
      </div>
      
      {activeEntry ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStop}
              loading={isLoading}
            >
              Stop
            </Button>
      ) : (
        <Button
          onClick={handleStart}
          variant="primary"
          size="sm"
          loading={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white border-none"
        >
          <Play size={16} className="mr-2 fill-current" /> Start
        </Button>
      )}
    </div>
  )
}
