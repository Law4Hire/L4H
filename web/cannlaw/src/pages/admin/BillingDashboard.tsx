import React, { useState, useEffect } from 'react'
import { Card, Button, Input } from '@l4h/shared-ui'
import { Download, User, Clock, CheckCircle, AlertCircle } from '@l4h/shared-ui'
import { useAuth } from '../../hooks/useAuth'

interface BillingSummary {
  attorneyId: number
  attorneyName: string
  totalHours: number
  totalAmount: number
  billedAmount: number
  unbilledAmount: number
  clientCount: number
  averageRate: number
}

interface TimeEntry {
  id: number
  attorneyId: number
  attorneyName: string
  clientId: number
  clientName: string
  startTime: string
  duration: number
  description: string
  hourlyRate: number
  billableAmount: number
  isBilled: boolean
  billedDate?: string
}

interface BillingFilters {
  attorneyId: string
  startDate: string
  endDate: string
  billingStatus: string
}

const BillingDashboard: React.FC = () => {
  const { isAdmin } = useAuth()
  const [billingSummaries, setBillingSummaries] = useState<BillingSummary[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [selectedAttorney, setSelectedAttorney] = useState<BillingSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<BillingFilters>({
    attorneyId: '',
    startDate: '',
    endDate: '',
    billingStatus: ''
  })
  const [showDetailedView, setShowDetailedView] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      fetchBillingData()
    }
  }, [isAdmin, filters])

  const fetchBillingData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('jwt_token')
      
      // Build query parameters
      const params = new URLSearchParams()
      if (filters.attorneyId) params.append('attorneyId', filters.attorneyId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.billingStatus) params.append('status', filters.billingStatus)

      const [summaryResponse, entriesResponse] = await Promise.all([
        fetch(`/api/v1/billing/summary?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/v1/billing/entries?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (summaryResponse.ok && entriesResponse.ok) {
        const summaries = await summaryResponse.json()
        const entries = await entriesResponse.json()
        
        setBillingSummaries(summaries)
        setTimeEntries(entries)
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: keyof BillingFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleExportReport = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const params = new URLSearchParams()
      if (filters.attorneyId) params.append('attorneyId', filters.attorneyId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.billingStatus) params.append('status', filters.billingStatus)

      const response = await fetch(`/api/v1/billing/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `billing-report-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('Failed to export report')
    }
  }

  const getTotalStats = () => {
    return billingSummaries.reduce((acc, summary) => ({
      totalHours: acc.totalHours + summary.totalHours,
      totalAmount: acc.totalAmount + summary.totalAmount,
      billedAmount: acc.billedAmount + summary.billedAmount,
      unbilledAmount: acc.unbilledAmount + summary.unbilledAmount
    }), { totalHours: 0, totalAmount: 0, billedAmount: 0, unbilledAmount: 0 })
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatHours = (hours: number): string => {
    return `${hours.toFixed(1)}h`
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="text-gray-600">You need admin privileges to access the billing dashboard.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalStats = getTotalStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Dashboard</h1>
          <p className="text-gray-600">Monitor attorney billing and time tracking</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button 
            variant={showDetailedView ? 'primary' : 'outline'}
            onClick={() => setShowDetailedView(!showDetailedView)}
          >
            {showDetailedView ? 'Summary View' : 'Detailed View'}
          </Button>
        </div>
      </div>   
   {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attorney</label>
            <select
              value={filters.attorneyId}
              onChange={(e) => handleFilterChange('attorneyId', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Attorneys</option>
              {billingSummaries.map(summary => (
                <option key={summary.attorneyId} value={summary.attorneyId.toString()}>
                  {summary.attorneyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Status</label>
            <select
              value={filters.billingStatus}
              onChange={(e) => handleFilterChange('billingStatus', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Entries</option>
              <option value="billed">Billed Only</option>
              <option value="unbilled">Unbilled Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatHours(totalStats.totalHours)}</p>
              <p className="text-sm text-gray-600">Total Hours</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-green-600 font-bold">$</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalStats.totalAmount)}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.billedAmount)}</p>
              <p className="text-sm text-gray-600">Billed Amount</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalStats.unbilledAmount)}</p>
              <p className="text-sm text-gray-600">Unbilled Amount</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Attorney Billing Summary Cards */}
      {!showDetailedView && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {billingSummaries.map((summary) => (
            <div key={summary.attorneyId} 
                 className="cursor-pointer"
                 onClick={() => setSelectedAttorney(summary)}>
              <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{summary.attorneyName}</h3>
                    <p className="text-sm text-gray-600">{summary.clientCount} clients</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Hours</span>
                  <span className="font-semibold text-gray-900">{formatHours(summary.totalHours)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(summary.totalAmount)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Rate</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(summary.averageRate)}/hr</span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-green-600">Billed</span>
                    <span className="font-semibold text-green-600">{formatCurrency(summary.billedAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-yellow-600">Unbilled</span>
                    <span className="font-semibold text-yellow-600">{formatCurrency(summary.unbilledAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Billing Progress</span>
                  <span>{((summary.billedAmount / summary.totalAmount) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(summary.billedAmount / summary.totalAmount) * 100}%` }}
                  ></div>
                </div>
              </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Time Entries View */}
      {showDetailedView && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Detailed Time Entries ({timeEntries.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attorney
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.startTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.attorneyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.clientName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatHours(entry.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(entry.hourlyRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(entry.billableAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.isBilled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.isBilled ? 'Billed' : 'Unbilled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {timeEntries.length === 0 && (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No time entries found</h3>
              <p className="text-gray-600">Time entries will appear here when attorneys start tracking time.</p>
            </div>
          )}
        </Card>
      )}

      {/* Selected Attorney Detail Modal */}
      {selectedAttorney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedAttorney.attorneyName} - Billing Details
                </h2>
                <Button variant="outline" onClick={() => setSelectedAttorney(null)}>
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{formatHours(selectedAttorney.totalHours)}</p>
                  <p className="text-sm text-gray-600">Total Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedAttorney.billedAmount)}</p>
                  <p className="text-sm text-gray-600">Billed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(selectedAttorney.unbilledAmount)}</p>
                  <p className="text-sm text-gray-600">Unbilled</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600">
                  Detailed time entries for this attorney would be displayed here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingDashboard