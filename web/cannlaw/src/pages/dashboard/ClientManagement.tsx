import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Modal } from '@l4h/shared-ui'
import { Search, Filter, User, Phone, Calendar, Edit, AlertCircle, CheckCircle, Clock, Plus } from '@l4h/shared-ui'
import { useAuth } from '../../hooks/useAuth'
import { useAttorneys } from '../../hooks/useAttorneys'
import { useClients } from '../../hooks/useClients'

interface Client {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  countryOfOrigin: string
  assignedAttorneyId?: number
  assignedAttorney?: {
    id: number
    name: string
    email: string
  }
  cases: Case[]
  createdAt: string
  updatedAt: string
}

interface Case {
  id: number
  clientId: number
  caseType: string
  status: CaseStatus
  description: string
  startDate: string
  completionDate?: string
  governmentCaseNumber?: string
  rejectionReason?: string
}

enum CaseStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress', 
  Paid = 'Paid',
  FormsCompleted = 'Forms Completed',
  Complete = 'Complete',
  ClosedRejected = 'Closed (US Government Rejected)'
}

interface SearchFilters {
  searchTerm: string
  assignedAttorney: string
  caseStatus: string
  caseType: string
  dateRange: string
}

const ClientManagement: React.FC = () => {
  const { user, isAdmin, isLegalProfessional } = useAuth()
  const { clients, isLoading, searchClients, assignClient } = useClients()
  const { attorneys } = useAttorneys()
  
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    assignedAttorney: '',
    caseStatus: '',
    caseType: '',
    dateRange: ''
  })
  
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [clientToAssign, setClientToAssign] = useState<Client | null>(null)
  const [selectedAttorney, setSelectedAttorney] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  useEffect(() => {
    // Initial load with role-based filtering
    const initialFilters: SearchFilters = {
      searchTerm: '',
      assignedAttorney: isLegalProfessional && user?.attorneyId ? user.attorneyId.toString() : '',
      caseStatus: '',
      caseType: '',
      dateRange: ''
    }
    searchClients(initialFilters)
  }, [user, isLegalProfessional])

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Debounce search for search term
    if (key === 'searchTerm') {
      const timeoutId = setTimeout(() => {
        searchClients(newFilters)
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      searchClients(newFilters)
    }
  }

  const handleAssignClient = async () => {
    if (!clientToAssign || !selectedAttorney) return

    setIsAssigning(true)
    try {
      const result = await assignClient(clientToAssign.id, parseInt(selectedAttorney))
      if (result.success) {
        setShowAssignModal(false)
        setClientToAssign(null)
        setSelectedAttorney('')
        // Refresh the client list
        searchClients(filters)
      } else {
        alert('Failed to assign client: ' + result.error)
      }
    } catch (error) {
      alert('Failed to assign client')
    } finally {
      setIsAssigning(false)
    }
  }

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      searchTerm: '',
      assignedAttorney: isLegalProfessional && user?.attorneyId ? user.attorneyId.toString() : '',
      caseStatus: '',
      caseType: '',
      dateRange: ''
    }
    setFilters(clearedFilters)
    searchClients(clearedFilters)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case CaseStatus.NotStarted:
        return 'bg-gray-100 text-gray-800'
      case CaseStatus.InProgress:
        return 'bg-blue-100 text-blue-800'
      case CaseStatus.Paid:
        return 'bg-green-100 text-green-800'
      case CaseStatus.FormsCompleted:
        return 'bg-purple-100 text-purple-800'
      case CaseStatus.Complete:
        return 'bg-green-100 text-green-800'
      case CaseStatus.ClosedRejected:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case CaseStatus.NotStarted:
        return <Clock className="w-4 h-4" />
      case CaseStatus.InProgress:
        return <AlertCircle className="w-4 h-4" />
      case CaseStatus.Paid:
        return <CheckCircle className="w-4 h-4" />
      case CaseStatus.FormsCompleted:
        return <CheckCircle className="w-4 h-4" />
      case CaseStatus.Complete:
        return <CheckCircle className="w-4 h-4" />
      case CaseStatus.ClosedRejected:
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getClientFullName = (client: Client) => {
    return `${client.firstName} ${client.lastName}`.trim()
  }

  const getClientPrimaryCase = (client: Client) => {
    return client.cases.find(c => c.status !== CaseStatus.Complete && c.status !== CaseStatus.ClosedRejected) || client.cases[0]
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Manage all clients and their case assignments' 
              : 'Manage your assigned clients and their cases'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
              <Filter className="w-4 h-4 mr-2" />
              {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
            </Button>
          )}
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add New Client
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search clients by name, email, case type, or government case number..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </Card>

      {/* Advanced Filters */}
      {(showAdvancedFilters || !isAdmin) && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {isAdmin && (
              <div>
                <label htmlFor="attorney-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Attorney
                </label>
                <select
                  id="attorney-filter"
                  value={filters.assignedAttorney}
                  onChange={(e) => handleFilterChange('assignedAttorney', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Attorneys</option>
                  <option value="unassigned">Unassigned</option>
                  {attorneys.map(attorney => (
                    <option key={attorney.id} value={attorney.id.toString()}>
                      {attorney.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Case Status
              </label>
              <select
                id="status-filter"
                value={filters.caseStatus}
                onChange={(e) => handleFilterChange('caseStatus', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                {Object.values(CaseStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="case-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Case Type
              </label>
              <select
                id="case-type-filter"
                value={filters.caseType}
                onChange={(e) => handleFilterChange('caseType', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Case Types</option>
                <option value="Family-Based Immigration">Family-Based Immigration</option>
                <option value="Employment Visa">Employment Visa</option>
                <option value="Investment Visa">Investment Visa</option>
                <option value="Asylum">Asylum</option>
                <option value="Naturalization">Naturalization</option>
                <option value="Waiver Application">Waiver Application</option>
              </select>
            </div>

            <div>
              <label htmlFor="date-range-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                id="date-range-filter"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{clients.length}</p>
            <p className="text-sm text-gray-600">Total Clients</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {clients.filter(c => {
                const primaryCase = getClientPrimaryCase(c)
                return primaryCase?.status === CaseStatus.InProgress
              }).length}
            </p>
            <p className="text-sm text-gray-600">Active Cases</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {clients.filter(c => {
                const primaryCase = getClientPrimaryCase(c)
                return primaryCase?.status === CaseStatus.NotStarted
              }).length}
            </p>
            <p className="text-sm text-gray-600">Not Started</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {clients.filter(c => !c.assignedAttorneyId).length}
            </p>
            <p className="text-sm text-gray-600">Unassigned</p>
          </div>
        </Card>
      </div>

      {/* Client List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Clients ({clients.length})
          </h2>
        </div>
        
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first client.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {clients.map((client) => {
              const primaryCase = getClientPrimaryCase(client)
              const fullName = getClientFullName(client)
              
              return (
                <Card key={client.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Client Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {fullName}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{client.email}</p>
                          {client.assignedAttorney ? (
                            <p className="text-xs text-blue-600">
                              Assigned to {client.assignedAttorney.name}
                            </p>
                          ) : (
                            <p className="text-xs text-red-600">Unassigned</p>
                          )}
                        </div>
                      </div>
                      
                      {isAdmin && !client.assignedAttorneyId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setClientToAssign(client)
                            setShowAssignModal(true)
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>From {client.countryOfOrigin}</span>
                      </div>
                    </div>

                    {/* Case Information */}
                    {primaryCase && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Primary Case</span>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(primaryCase.status)}`}>
                            {getStatusIcon(primaryCase.status)}
                            <span className="ml-1">{primaryCase.status}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{primaryCase.caseType}</p>
                        {primaryCase.governmentCaseNumber && (
                          <p className="text-xs text-gray-500 mt-1">
                            Case #: {primaryCase.governmentCaseNumber}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Multiple Cases Indicator */}
                    {client.cases.length > 1 && (
                      <div className="mb-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {client.cases.length} cases
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        Added {new Date(client.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Card>

      {/* Client Assignment Modal */}
      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Client to Attorney"
        size="md"
      >
        <div className="space-y-4">
          {clientToAssign && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">
                {getClientFullName(clientToAssign)}
              </h4>
              <p className="text-sm text-gray-600">{clientToAssign.email}</p>
            </div>
          )}

          <div>
            <label htmlFor="attorney-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Attorney
            </label>
            <select
              id="attorney-select"
              value={selectedAttorney}
              onChange={(e) => setSelectedAttorney(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose an attorney...</option>
              {attorneys.filter(a => a.isActive).map(attorney => (
                <option key={attorney.id} value={attorney.id.toString()}>
                  {attorney.name} - {attorney.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAssignModal(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignClient}
              loading={isAssigning}
              disabled={!selectedAttorney}
            >
              {isAssigning ? 'Assigning...' : 'Assign Client'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ClientManagement