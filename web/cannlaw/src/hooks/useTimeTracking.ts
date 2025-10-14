import { useState, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'

interface TimeEntry {
  id: number
  clientId: number
  client: {
    id: number
    firstName: string
    lastName: string
  }
  attorneyId: number
  attorney: {
    id: number
    name: string
  }
  startTime: string
  endTime: string
  duration: number // In hours (0.1 increments)
  description: string
  notes?: string
  hourlyRate: number
  billableAmount: number
  isBilled: boolean
  billedDate?: string
  createdAt: string
}

interface ActiveTimer {
  clientId: number
  clientName: string
  startTime: Date
  description: string
  notes?: string
}

interface TimerResult {
  success: boolean
  error?: string
  timeEntry?: TimeEntry
}

export function useTimeTracking() {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0) // In seconds
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useAuth()

  // Update elapsed time every second when timer is active
  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setElapsedTime(0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [activeTimer])

  // Check for existing active timer on mount
  useEffect(() => {
    checkActiveTimer()
  }, [user])

  const checkActiveTimer = async () => {
    if (!user || user.role !== 'LegalProfessional') return

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch('/api/v1/time-tracking/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const timer = await response.json()
        if (timer) {
          setActiveTimer({
            clientId: timer.clientId,
            clientName: timer.clientName,
            startTime: new Date(timer.startTime),
            description: timer.description,
            notes: timer.notes
          })
        }
      }
    } catch (err) {
      console.error('Error checking active timer:', err)
    }
  }

  const startTimer = async (clientId: number, clientName: string, description: string): Promise<TimerResult> => {
    if (!user || user.role !== 'LegalProfessional') {
      return { success: false, error: 'Unauthorized: Legal professional access required' }
    }

    if (activeTimer) {
      return { success: false, error: 'Timer is already running. Stop the current timer first.' }
    }

    try {
      setIsStarting(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch('/api/v1/time-tracking/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ clientId, description })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to start timer')
      }

      const timer = {
        clientId,
        clientName,
        startTime: new Date(),
        description
      }

      setActiveTimer(timer)
      return { success: true }
    } catch (err) {
      console.error('Error starting timer:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsStarting(false)
    }
  }

  const stopTimer = async (notes?: string): Promise<TimerResult> => {
    if (!activeTimer) {
      return { success: false, error: 'No active timer to stop' }
    }

    try {
      setIsStopping(true)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch('/api/v1/time-tracking/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to stop timer')
      }

      const timeEntry = await response.json()
      setActiveTimer(null)
      setElapsedTime(0)

      return { success: true, timeEntry }
    } catch (err) {
      console.error('Error stopping timer:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    } finally {
      setIsStopping(false)
    }
  }

  const updateTimerDescription = (description: string) => {
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, description })
    }
  }

  const updateTimerNotes = (notes: string) => {
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, notes })
    }
  }

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getBillableHours = (seconds: number): number => {
    // Convert to hours and round up to nearest 6-minute increment (0.1 hour)
    const hours = seconds / 3600
    return Math.ceil(hours * 10) / 10
  }

  const getEstimatedBillableAmount = (seconds: number, hourlyRate: number): number => {
    const billableHours = getBillableHours(seconds)
    return billableHours * hourlyRate
  }

  const canStartTimer = (): boolean => {
    return user?.role === 'LegalProfessional' && !activeTimer
  }

  const canStopTimer = (): boolean => {
    return user?.role === 'LegalProfessional' && !!activeTimer
  }

  return {
    activeTimer,
    elapsedTime,
    isStarting,
    isStopping,
    startTimer,
    stopTimer,
    updateTimerDescription,
    updateTimerNotes,
    formatElapsedTime: formatElapsedTime(elapsedTime),
    getBillableHours: getBillableHours(elapsedTime),
    getEstimatedBillableAmount,
    canStartTimer: canStartTimer(),
    canStopTimer: canStopTimer(),
    isTimerActive: !!activeTimer
  }
}