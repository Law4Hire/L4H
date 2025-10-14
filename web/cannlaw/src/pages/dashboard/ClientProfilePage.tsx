import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Input } from '@l4h/shared-ui'
import { User, Mail, Phone, Calendar, Edit, Save, X, Plus, Download, Clock, CheckCircle, AlertCircle } from '@l4h/shared-ui'
import { useClients } from '../../hooks/useClients'
import { useAuth } from '../../hooks/useAuth'

interface ClientProfilePageProps {}

enum CaseStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress', 
  Paid = 'Paid',
  FormsCompleted = 'Forms Completed',
  Complete = 'Complete',
  ClosedRejected = 'Closed (US Government Rejected)'
}

interface Document {
  id: number
  fileName: string
  originalFileName: string
  fileUrl: string
  contentType: string
  fileSize: number
  category: string
  description: string
  uploadDate: string
  uploadedBy: string
}

interface TimeEntry {
  id: number
  startTime: string
  endTime: string
  duration: number
  description: string
  notes: string
  hourlyRate: number
  billableAmount: number
  isBilled: boolean
  billedDate?: string
  createdAt: string
}

const ClientProfilePage: React.FC<ClientProfilePageProps> = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  useAuth() // For future authentication checks
  const { getClient } = useClients()
  
  const [client, setClient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedClient, setEditedClient] = useState<any>(null)
  // Modal states for future implementation
  const [, setShowCaseModal] = useState(false)
  const [, setShowDocumentModal] = useState(false)
  const [, setSelectedCase] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (id) {
      fetchClientData()
    }
  }, [id])

  const fetchClientData = async () => {
    try {
      setIsLoading(true)
      const clientData = await getClient(parseInt(id!))
      setClient(clientData)
      setEditedClient({ ...clientData })
      
      // Fetch related data
      void fetchDocuments()
      void fetchTimeEntries()
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setIsLoading(false)
    }
  } 
 const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/clients/${id}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const docs = await response.json()
        setDocuments(docs)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const fetchTimeEntries = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/clients/${id}/time-entries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const entries = await response.json()
        setTimeEntries(entries)
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
    }
  }

  const handleSaveClient = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedClient)
      })

      if (response.ok) {
        setClient(editedClient)
        setIsEditing(false)
      } else {
        alert('Failed to update client')
      }
    } catch (error) {
      console.error('Error updating client:', error)
      alert('Failed to update client')
    }
  }

  const handleCaseStatusUpdate = async (caseId: number, newStatus: CaseStatus) => {
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Refresh client data to get updated case status
        await fetchClientData()
      } else {
        alert('Failed to update case status')
      }
    } catch (error) {
      console.error('Error updating case status:', error)
      alert('Failed to update case status')
    }
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
      case CaseStatus.FormsCompleted:
      case CaseStatus.Complete:
        return <CheckCircle className="w-4 h-4" />
      case CaseStatus.ClosedRejected:
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Client not found</h3>
        <p className="text-gray-600">The requested client could not be found.</p>
        <Button variant="primary" onClick={() => navigate('/dashboard/clients')} className="mt-4">
          Back to Clients
        </Button>
      </div>
    )
  }

  const fullName = `${client.firstName} ${client.lastName}`.trim()
  const totalBillableAmount = timeEntries.reduce((sum, entry) => sum + entry.billableAmount, 0)
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/dashboard/clients')}>
            ← Back to Clients
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-gray-600">Client Profile & Case Management</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => {
                setIsEditing(false)
                setEditedClient({ ...client })
              }}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveClient}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>    
  {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: User },
            { id: 'cases', name: 'Cases', icon: CheckCircle },
            { id: 'documents', name: 'Documents', icon: User },
            { id: 'time', name: 'Time Entries', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <Input
                      value={editedClient.firstName}
                      onChange={(e) => setEditedClient({...editedClient, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <Input
                      value={editedClient.lastName}
                      onChange={(e) => setEditedClient({...editedClient, lastName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={editedClient.email}
                      onChange={(e) => setEditedClient({...editedClient, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <Input
                      value={editedClient.phone}
                      onChange={(e) => setEditedClient({...editedClient, phone: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <Input
                      value={editedClient.address}
                      onChange={(e) => setEditedClient({...editedClient, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <Input
                      type="date"
                      value={editedClient.dateOfBirth?.split('T')[0]}
                      onChange={(e) => setEditedClient({...editedClient, dateOfBirth: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
                    <Input
                      value={editedClient.countryOfOrigin}
                      onChange={(e) => setEditedClient({...editedClient, countryOfOrigin: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.email}</p>
                        <p className="text-xs text-gray-500">Email Address</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.phone}</p>
                        <p className="text-xs text-gray-500">Phone Number</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 text-gray-400">📍</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.address}</p>
                        <p className="text-xs text-gray-500">Address</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(client.dateOfBirth).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">Date of Birth</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Country of Origin:</span> {client.countryOfOrigin}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Cases</span>
                  <span className="text-lg font-semibold text-gray-900">{client.cases?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Hours</span>
                  <span className="text-lg font-semibold text-gray-900">{totalHours.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Billed</span>
                  <span className="text-lg font-semibold text-green-600">${totalBillableAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-lg font-semibold text-gray-900">{documents.length}</span>
                </div>
              </div>
            </Card>

            {/* Assigned Attorney */}
            {client.assignedAttorney && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Attorney</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client.assignedAttorney.name}</p>
                    <p className="text-xs text-gray-500">{client.assignedAttorney.email}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}   
   {/* Cases Tab */}
      {activeTab === 'cases' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Cases</h2>
            <Button variant="primary" onClick={() => setShowCaseModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Case
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {client.cases?.map((caseItem: any) => (
              <Card key={caseItem.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{caseItem.caseType}</h3>
                    <p className="text-sm text-gray-600">{caseItem.description}</p>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                    {getStatusIcon(caseItem.status)}
                    <span className="ml-1">{caseItem.status}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="text-gray-900">{new Date(caseItem.startDate).toLocaleDateString()}</span>
                  </div>
                  {caseItem.governmentCaseNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Case Number:</span>
                      <span className="text-gray-900">{caseItem.governmentCaseNumber}</span>
                    </div>
                  )}
                  {caseItem.completionDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completed:</span>
                      <span className="text-gray-900">{new Date(caseItem.completionDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedCase(caseItem)
                    setShowCaseModal(true)
                  }}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  <select
                    value={caseItem.status}
                    onChange={(e) => handleCaseStatusUpdate(caseItem.id, e.target.value as CaseStatus)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {Object.values(CaseStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </Card>
            ))}
          </div>

          {(!client.cases || client.cases.length === 0) && (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No cases yet</h3>
              <p className="text-gray-600">Get started by adding the first case for this client.</p>
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <Button variant="primary" onClick={() => setShowDocumentModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{doc.originalFileName}</h4>
                    <p className="text-xs text-gray-500">{doc.category}</p>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <Button variant="outline" size="sm">
                      👁️
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Size: {(doc.fileSize / 1024).toFixed(1)} KB</p>
                  <p>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</p>
                  <p>By: {doc.uploadedBy}</p>
                </div>
                
                {doc.description && (
                  <p className="text-xs text-gray-600 mt-2">{doc.description}</p>
                )}
              </Card>
            ))}
          </div>

          {documents.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4 text-4xl">📄</div>
              <h3 className="text-lg font-medium text-gray-900">No documents uploaded</h3>
              <p className="text-gray-600">Upload documents to keep all case files organized.</p>
            </div>
          )}
        </div>
      )}

      {/* Time Entries Tab */}
      {activeTab === 'time' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Time Entries</h2>
            <div className="flex space-x-3">
              <div className="text-sm text-gray-600">
                Total: {totalHours.toFixed(1)} hours | ${totalBillableAmount.toFixed(2)}
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.startTime).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.duration.toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <p className="font-medium">{entry.description}</p>
                          {entry.notes && <p className="text-gray-500 text-xs mt-1">{entry.notes}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${entry.hourlyRate.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${entry.billableAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.isBilled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
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
                <h3 className="text-lg font-medium text-gray-900">No time entries</h3>
                <p className="text-gray-600">Time tracking entries will appear here.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default ClientProfilePage