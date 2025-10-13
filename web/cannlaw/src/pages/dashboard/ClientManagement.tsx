import React, { useState } from 'react'
import { Card, Button, Input } from '@l4h/shared-ui'

interface Client {
  id: number
  name: string
  email: string
  phone: string
  caseType: string
  status: string
  lastContact: string
  priority: 'low' | 'medium' | 'high'
}

const ClientManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCaseType, setFilterCaseType] = useState('all')

  // Mock client data - in real implementation, this would come from API
  const [clients] = useState<Client[]>([
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      caseType: 'Family-Based Immigration',
      status: 'Active',
      lastContact: '2024-12-10',
      priority: 'high'
    },
    {
      id: 2,
      name: 'Maria Garcia',
      email: 'maria.garcia@email.com',
      phone: '(555) 234-5678',
      caseType: 'Employment Visa',
      status: 'Pending Documents',
      lastContact: '2024-12-08',
      priority: 'high'
    },
    {
      id: 3,
      name: 'David Chen',
      email: 'david.chen@email.com',
      phone: '(555) 345-6789',
      caseType: 'Investment Visa',
      status: 'Under Review',
      lastContact: '2024-12-05',
      priority: 'medium'
    },
    {
      id: 4,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '(555) 456-7890',
      caseType: 'Waiver Application',
      status: 'Completed',
      lastContact: '2024-12-01',
      priority: 'low'
    },
    {
      id: 5,
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@email.com',
      phone: '(555) 567-8901',
      caseType: 'Family-Based Immigration',
      status: 'Active',
      lastContact: '2024-12-09',
      priority: 'medium'
    }
  ])

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.caseType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus
    const matchesCaseType = filterCaseType === 'all' || client.caseType === filterCaseType
    
    return matchesSearch && matchesStatus && matchesCaseType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Pending Documents':
        return 'bg-yellow-100 text-yellow-800'
      case 'Under Review':
        return 'bg-blue-100 text-blue-800'
      case 'Completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600">Manage your clients and their cases</p>
        </div>
        <Button variant="primary">
          Add New Client
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Clients
            </label>
            <Input
              id="search"
              type="text"
              placeholder="Search by name, email, or case type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Documents">Pending Documents</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label htmlFor="case-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Case Type
            </label>
            <select
              id="case-type-filter"
              value={filterCaseType}
              onChange={(e) => setFilterCaseType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Case Types</option>
              <option value="Family-Based Immigration">Family-Based Immigration</option>
              <option value="Employment Visa">Employment Visa</option>
              <option value="Investment Visa">Investment Visa</option>
              <option value="Waiver Application">Waiver Application</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
                setFilterCaseType('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

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
              {clients.filter(c => c.status === 'Active').length}
            </p>
            <p className="text-sm text-gray-600">Active Cases</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {clients.filter(c => c.status === 'Pending Documents').length}
            </p>
            <p className="text-sm text-gray-600">Pending Documents</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {clients.filter(c => c.priority === 'high').length}
            </p>
            <p className="text-sm text-gray-600">High Priority</p>
          </div>
        </Card>
      </div>

      {/* Client List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Clients ({filteredClients.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                      <div className="text-sm text-gray-500">{client.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.caseType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(client.priority)}`}>
                      {client.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(client.lastContact).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">View</button>
                    <button className="text-green-600 hover:text-green-900">Edit</button>
                    <button className="text-purple-600 hover:text-purple-900">Contact</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterCaseType !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first client.'
              }
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default ClientManagement