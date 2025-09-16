import React, { useState, useEffect } from 'react'
import { Card, Button, useToast } from '@l4h/shared-ui'

interface AdminAnalyticsDashboardResponse {
  totalUsers: number
  newUsersThisMonth: number
  totalCases: number
  activeCases: number
  newCasesThisMonth: number
  totalRevenue: number
  revenueThisMonth: number
  userGrowthRate: number
  caseGrowthRate: number
  revenueGrowthRate: number
  caseStatusCounts: AdminStatusCountResponse[]
  popularVisaTypes: AdminVisaTypeStatsResponse[]
  monthlyRevenueTrend: AdminMonthlyRevenueResponse[]
  recentActivity: AdminActivityResponse[]
}

interface AdminStatusCountResponse {
  status: string
  count: number
}

interface AdminVisaTypeStatsResponse {
  visaTypeCode: string
  visaTypeName: string
  count: number
  totalRevenue: number
}

interface AdminMonthlyRevenueResponse {
  month: string
  revenue: number
  caseCount: number
}

interface AdminActivityResponse {
  timestamp: string
  userEmail: string
  action: string
  targetType: string
  description: string
}

interface AdminFinancialAnalyticsResponse {
  totalRevenue: number
  paidInvoices: number
  averageInvoiceAmount: number
  revenueByVisaType: AdminRevenueByTypeResponse[]
  monthlyRevenue: AdminMonthlyRevenueResponse[]
  paymentSuccessRate: number
  outstandingAmount: number
}

interface AdminRevenueByTypeResponse {
  visaTypeCode: string
  visaTypeName: string
  revenue: number
  invoiceCount: number
  averageAmount: number
}

interface AdminUserAnalyticsResponse {
  totalUsers: number
  newUsersLast30Days: number
  activeUsersLast30Days: number
  userRegistrationTrend: AdminRegistrationTrendResponse[]
  topCountries: AdminCountryStatsResponse[]
  userEngagementMetrics: AdminEngagementMetricsResponse
}

interface AdminRegistrationTrendResponse {
  date: string
  registrations: number
}

interface AdminCountryStatsResponse {
  countryCode: string
  userCount: number
}

interface AdminEngagementMetricsResponse {
  averageSessionsPerUser: number
  averageCasesPerUser: number
  completionRate: number
}

const AdminReportsPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<AdminAnalyticsDashboardResponse | null>(null)
  const [financialData, setFinancialData] = useState<AdminFinancialAnalyticsResponse | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<AdminUserAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'users'>('overview')
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const { success, error } = useToast()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('jwt_token')
      
      if (!token) {
        error('Authentication required', 'Please log in to access admin features')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Load dashboard analytics
      const dashboardResponse = await fetch('/api/v1/admin/analytics/dashboard', { headers })
      if (dashboardResponse.ok) {
        const dashboard = await dashboardResponse.json()
        setDashboardData(dashboard)
      }

      // Load financial analytics
      const financialUrl = dateRange.startDate && dateRange.endDate 
        ? `/api/v1/admin/analytics/financial?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
        : '/api/v1/admin/analytics/financial'
      const financialResponse = await fetch(financialUrl, { headers })
      if (financialResponse.ok) {
        const financial = await financialResponse.json()
        setFinancialData(financial)
      }

      // Load user analytics
      const userResponse = await fetch('/api/v1/admin/analytics/users', { headers })
      if (userResponse.ok) {
        const users = await userResponse.json()
        setUserAnalytics(users)
      }

    } catch (err) {
      console.error('Error loading analytics:', err)
      error('Failed to load analytics', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reports & Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive business intelligence and performance metrics
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview Dashboard' },
              { key: 'financial', label: 'Financial Analytics' },
              { key: 'users', label: 'User Analytics' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Dashboard Tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card title="Total Users">
              <div className="text-3xl font-bold text-gray-900">{dashboardData.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-green-600">+{dashboardData.newUsersThisMonth} this month</div>
              <div className="text-xs text-gray-500">Growth: {formatPercentage(dashboardData.userGrowthRate)}</div>
            </Card>

            <Card title="Total Cases">
              <div className="text-3xl font-bold text-gray-900">{dashboardData.totalCases.toLocaleString()}</div>
              <div className="text-sm text-blue-600">{dashboardData.activeCases} active</div>
              <div className="text-xs text-gray-500">Growth: {formatPercentage(dashboardData.caseGrowthRate)}</div>
            </Card>

            <Card title="Total Revenue">
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(dashboardData.totalRevenue)}</div>
              <div className="text-sm text-green-600">{formatCurrency(dashboardData.revenueThisMonth)} this month</div>
              <div className="text-xs text-gray-500">Growth: {formatPercentage(dashboardData.revenueGrowthRate)}</div>
            </Card>

            <Card title="New Cases">
              <div className="text-3xl font-bold text-gray-900">{dashboardData.newCasesThisMonth}</div>
              <div className="text-sm text-gray-600">This month</div>
              <div className="text-xs text-gray-500">Cases opened recently</div>
            </Card>
          </div>

          {/* Case Status Distribution */}
          <Card title="Case Status Distribution">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {dashboardData.caseStatusCounts.map((status) => (
                <div key={status.status} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{status.count}</div>
                  <div className="text-sm text-gray-600 capitalize">{status.status}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Popular Visa Types */}
          <Card title="Popular Visa Types">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cases</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.popularVisaTypes.map((visa) => (
                    <tr key={visa.visaTypeCode}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{visa.visaTypeCode}</div>
                        <div className="text-sm text-gray-500">{visa.visaTypeName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visa.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(visa.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Monthly Revenue Trend */}
          <Card title="Revenue Trend (Last 12 Months)">
            <div className="space-y-4">
              {dashboardData.monthlyRevenueTrend.map((month) => (
                <div key={month.month} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="text-sm font-medium text-gray-900">{month.month}</div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">{month.caseCount} cases</div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(month.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card title="Recent System Activity">
            <div className="space-y-3">
              {dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{activity.description}</div>
                    <div className="text-xs text-gray-500">
                      {activity.userEmail} • {formatDate(activity.timestamp)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                    {activity.targetType}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Financial Analytics Tab */}
      {activeTab === 'financial' && financialData && (
        <div className="space-y-6">
          {/* Date Range Filter */}
          <Card title="Filter by Date Range">
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2"
              />
              <Button onClick={loadAnalytics}>Apply Filter</Button>
            </div>
          </Card>

          {/* Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card title="Total Revenue">
              <div className="text-3xl font-bold text-green-600">{formatCurrency(financialData.totalRevenue)}</div>
            </Card>

            <Card title="Paid Invoices">
              <div className="text-3xl font-bold text-blue-600">{financialData.paidInvoices}</div>
            </Card>

            <Card title="Average Invoice">
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(financialData.averageInvoiceAmount)}</div>
            </Card>

            <Card title="Success Rate">
              <div className="text-3xl font-bold text-green-600">{formatPercentage(financialData.paymentSuccessRate)}</div>
              <div className="text-sm text-gray-500">Payment success rate</div>
            </Card>
          </div>

          {/* Revenue by Visa Type */}
          <Card title="Revenue by Visa Type">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoices</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {financialData.revenueByVisaType.map((visa) => (
                    <tr key={visa.visaTypeCode}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{visa.visaTypeCode}</div>
                        <div className="text-sm text-gray-500">{visa.visaTypeName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(visa.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visa.invoiceCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(visa.averageAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Outstanding Amount */}
          {financialData.outstandingAmount > 0 && (
            <Card title="Outstanding Payments">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(financialData.outstandingAmount)}</div>
              <div className="text-sm text-gray-600">Amount pending payment</div>
            </Card>
          )}
        </div>
      )}

      {/* User Analytics Tab */}
      {activeTab === 'users' && userAnalytics && (
        <div className="space-y-6">
          {/* User Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Total Users">
              <div className="text-3xl font-bold text-blue-600">{userAnalytics.totalUsers.toLocaleString()}</div>
            </Card>

            <Card title="New Users (30 days)">
              <div className="text-3xl font-bold text-green-600">{userAnalytics.newUsersLast30Days}</div>
            </Card>

            <Card title="Active Users (30 days)">
              <div className="text-3xl font-bold text-purple-600">{userAnalytics.activeUsersLast30Days}</div>
            </Card>
          </div>

          {/* Engagement Metrics */}
          <Card title="User Engagement">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {userAnalytics.userEngagementMetrics.averageSessionsPerUser.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg Sessions per User</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {userAnalytics.userEngagementMetrics.averageCasesPerUser.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg Cases per User</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatPercentage(userAnalytics.userEngagementMetrics.completionRate)}
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
            </div>
          </Card>

          {/* Top Countries */}
          <Card title="Users by Country">
            <div className="space-y-3">
              {userAnalytics.topCountries.map((country) => (
                <div key={country.countryCode} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="font-medium text-gray-900">{country.countryCode}</div>
                  <div className="text-gray-600">{country.userCount} users</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Registration Trend */}
          <Card title="Registration Trend (Last 30 Days)">
            <div className="space-y-2">
              {userAnalytics.userRegistrationTrend.map((trend) => (
                <div key={trend.date} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="text-sm text-gray-900">{formatDate(trend.date)}</div>
                  <div className="text-sm font-medium text-gray-900">{trend.registrations} registrations</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AdminReportsPage

