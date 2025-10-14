import { useState } from 'react'
import { useAuth } from './useAuth'

interface ReportFilters {
  attorneyId?: number
  clientId?: number
  startDate: string
  endDate: string
  includeUnbilledOnly?: boolean
  groupBy?: 'attorney' | 'client' | 'date'
  format?: 'pdf' | 'excel' | 'csv'
}

interface ReportData {
  summary: {
    totalHours: number
    totalAmount: number
    billedAmount: number
    unbilledAmount: number
    averageHourlyRate: number
  }
  details: ReportDetail[]
  period: {
    startDate: string
    endDate: string
  }
  generatedAt: string
  generatedBy: string
}

interface ReportDetail {
  id: number
  date: string
  attorneyName: string
  clientName: string
  description: string
  duration: number
  hourlyRate: number
  billableAmount: number
  isBilled: boolean
  billedDate?: string
}

interface ReportResult {
  success: boolean
  error?: string
  reportUrl?: string
  reportData?: ReportData
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  filters: Partial<ReportFilters>
  isDefault?: boolean
}

export function useBillingReports() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const generateReport = async (filters: ReportFilters): Promise<ReportResult> => {
    if (!user || user.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    try {
      setIsGenerating(true)
      setError(null)
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch('/api/v1/billing/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filters)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to generate report')
      }

      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        // Return report data for preview
        const reportData = await response.json()
        return { success: true, reportData }
      } else {
        // Handle file download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const filename = getReportFilename(filters)
        
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        return { success: true, reportUrl: url }
      }
    } catch (err) {
      console.error('Error generating report:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAttorneyReport = async (attorneyId: number, startDate: string, endDate: string, format: 'pdf' | 'excel' = 'pdf'): Promise<ReportResult> => {
    return generateReport({
      attorneyId,
      startDate,
      endDate,
      format,
      groupBy: 'client'
    })
  }

  const generateClientReport = async (clientId: number, startDate: string, endDate: string, format: 'pdf' | 'excel' = 'pdf'): Promise<ReportResult> => {
    return generateReport({
      clientId,
      startDate,
      endDate,
      format,
      groupBy: 'date'
    })
  }

  const generateUnbilledReport = async (startDate: string, endDate: string, format: 'pdf' | 'excel' = 'pdf'): Promise<ReportResult> => {
    return generateReport({
      startDate,
      endDate,
      includeUnbilledOnly: true,
      format,
      groupBy: 'attorney'
    })
  }

  const generateSummaryReport = async (startDate: string, endDate: string, format: 'pdf' | 'excel' = 'pdf'): Promise<ReportResult> => {
    return generateReport({
      startDate,
      endDate,
      format,
      groupBy: 'attorney'
    })
  }

  const previewReport = async (filters: ReportFilters): Promise<ReportResult> => {
    const previewFilters = { ...filters, format: undefined } // Remove format to get JSON response
    return generateReport(previewFilters)
  }

  const exportToExcel = async (filters: ReportFilters): Promise<ReportResult> => {
    return generateReport({ ...filters, format: 'excel' })
  }

  const exportToCsv = async (filters: ReportFilters): Promise<ReportResult> => {
    return generateReport({ ...filters, format: 'csv' })
  }

  const exportToPdf = async (filters: ReportFilters): Promise<ReportResult> => {
    return generateReport({ ...filters, format: 'pdf' })
  }

  const saveReportTemplate = async (template: Omit<ReportTemplate, 'id'>): Promise<ReportResult> => {
    if (!user || user.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch('/api/v1/billing/reports/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(template)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to save report template')
      }

      const savedTemplate = await response.json()
      setReportTemplates(prev => [...prev, savedTemplate])
      return { success: true }
    } catch (err) {
      console.error('Error saving report template:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    }
  }

  const loadReportTemplates = async (): Promise<ReportTemplate[]> => {
    if (!user || user.role !== 'Admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch('/api/v1/billing/reports/templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load report templates')
      }

      const templates = await response.json()
      setReportTemplates(templates)
      return templates
    } catch (err) {
      console.error('Error loading report templates:', err)
      throw err
    }
  }

  const deleteReportTemplate = async (templateId: string): Promise<ReportResult> => {
    if (!user || user.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    try {
      const token = localStorage.getItem('jwt_token')
      
      const response = await fetch(`/api/v1/billing/reports/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete report template')
      }

      setReportTemplates(prev => prev.filter(t => t.id !== templateId))
      return { success: true }
    } catch (err) {
      console.error('Error deleting report template:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      }
    }
  }

  const getReportFilename = (filters: ReportFilters): string => {
    const dateRange = `${filters.startDate}_to_${filters.endDate}`
    const format = filters.format || 'pdf'
    
    if (filters.attorneyId) {
      return `attorney-billing-report-${dateRange}.${format}`
    } else if (filters.clientId) {
      return `client-billing-report-${dateRange}.${format}`
    } else if (filters.includeUnbilledOnly) {
      return `unbilled-time-report-${dateRange}.${format}`
    } else {
      return `billing-summary-report-${dateRange}.${format}`
    }
  }

  const getDefaultTemplates = (): ReportTemplate[] => {
    return [
      {
        id: 'monthly-summary',
        name: 'Monthly Summary',
        description: 'Monthly billing summary for all attorneys',
        filters: {
          groupBy: 'attorney',
          format: 'pdf'
        },
        isDefault: true
      },
      {
        id: 'unbilled-time',
        name: 'Unbilled Time',
        description: 'All unbilled time entries',
        filters: {
          includeUnbilledOnly: true,
          groupBy: 'attorney',
          format: 'excel'
        },
        isDefault: true
      },
      {
        id: 'client-detail',
        name: 'Client Detail',
        description: 'Detailed billing by client',
        filters: {
          groupBy: 'client',
          format: 'pdf'
        },
        isDefault: true
      }
    ]
  }

  const canGenerateReports = (): boolean => {
    return user?.role === 'Admin'
  }

  const validateFilters = (filters: ReportFilters): { isValid: boolean; error?: string } => {
    if (!filters.startDate || !filters.endDate) {
      return { isValid: false, error: 'Start date and end date are required' }
    }

    const startDate = new Date(filters.startDate)
    const endDate = new Date(filters.endDate)

    if (startDate > endDate) {
      return { isValid: false, error: 'Start date must be before end date' }
    }

    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
    if (daysDiff > 365) {
      return { isValid: false, error: 'Date range cannot exceed 365 days' }
    }

    return { isValid: true }
  }

  return {
    isGenerating,
    error,
    reportTemplates,
    generateReport,
    generateAttorneyReport,
    generateClientReport,
    generateUnbilledReport,
    generateSummaryReport,
    previewReport,
    exportToExcel,
    exportToCsv,
    exportToPdf,
    saveReportTemplate,
    loadReportTemplates,
    deleteReportTemplate,
    getDefaultTemplates,
    canGenerateReports: canGenerateReports(),
    validateFilters
  }
}