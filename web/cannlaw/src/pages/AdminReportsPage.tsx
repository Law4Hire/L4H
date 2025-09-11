import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container, Card, Button, useToast } from '@l4h/shared-ui'
import { admin } from '@l4h/shared-ui'
import { useTranslation } from 'react-i18next'
import { Download, Calendar, DollarSign, Users, Clock, TrendingUp } from 'lucide-react'

// interface ReportData {
//   totalCases: number
//   totalRevenue: number
//   totalHours: number
//   activeUsers: number
//   monthlyGrowth: number
//   topCases: Array<{
//     id: string
//     title: string
//     revenue: number
//     hours: number
//   }>
//   revenueByMonth: Array<{
//     month: string
//     revenue: number
//   }>
// }

export default function AdminReportsPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  // Fetch report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['admin-reports', dateRange],
    queryFn: () => admin.reports('summary', { from: dateRange.start, to: dateRange.end })
  })

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      // For now, we'll simulate the export since exportReport doesn't exist in the API
      const response = await admin.reports('export', { from: dateRange.start, to: dateRange.end })
      
      // Create blob and download
      const blob = new Blob([response], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `admin-report-${dateRange.start}-${dateRange.end}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      success(t('common.success'), `Report exported as ${format.toUpperCase()}`)
    } catch (err) {
      showError(t('common.error'), err instanceof Error ? err.message : '')
    }
  }

  if (isLoading) {
    return (
      <Container>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-lg">{t('common.loading')}</div>
          </div>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('admin.reports')}</h1>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Export Buttons */}
      <div className="mb-6 flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => handleExportReport('excel')}
        >
          <Download className="h-4 w-4 mr-2" />
          {t('admin.exportExcel')}
        </Button>
        <Button
          onClick={() => handleExportReport('pdf')}
        >
          <Download className="h-4 w-4 mr-2" />
          {t('admin.exportPdf')}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('admin.totalCases')}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData?.totalCases || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('admin.totalRevenue')}</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${(reportData?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('admin.totalHours')}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(reportData?.totalHours || 0).toFixed(1)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('admin.activeUsers')}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData?.activeUsers || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Growth Indicator */}
      {reportData?.monthlyGrowth !== undefined && (
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{t('admin.monthlyGrowth')}</h3>
              <p className="text-sm text-gray-600">{t('admin.revenueGrowth')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className={`h-6 w-6 ${reportData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-2xl font-semibold ${reportData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.monthlyGrowth >= 0 ? '+' : ''}{reportData.monthlyGrowth.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Cases */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('admin.topCases')}</h3>
            {reportData?.topCases && reportData.topCases.length > 0 ? (
              <div className="space-y-4">
                {reportData.topCases.map((caseItem: any, index: number) => (
                  <div key={caseItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{caseItem.title}</p>
                        <p className="text-xs text-gray-500">Case #{caseItem.id.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${caseItem.revenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{caseItem.hours}h</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('admin.noData')}
              </div>
            )}
          </div>
        </Card>

        {/* Revenue by Month */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('admin.revenueByMonth')}</h3>
            {reportData?.revenueByMonth && reportData.revenueByMonth.length > 0 ? (
              <div className="space-y-3">
                {reportData.revenueByMonth.map((month: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{month.month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (month.revenue / Math.max(...reportData.revenueByMonth.map((m: any) => m.revenue))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-20 text-right">
                        ${month.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('admin.noData')}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Container>
  )
}

