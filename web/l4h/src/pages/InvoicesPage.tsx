import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container, Card, Button, EmptyState, useToast } from '@l4h/shared-ui'
import { invoices } from '@l4h/shared-ui'
import { useTranslation } from '@l4h/shared-ui'
import { FileText, Download, Eye, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  dueDate: string
  issueDate: string
  caseId: string
  description: string
}

export default function InvoicesPage() {
  const { t } = useTranslation()
  const { success, error } = useToast()

  // Fetch invoices
  const { data: invoicesList = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoices.list() // TODO: Pass caseId if needed
  })

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await invoices.download(invoiceId)
      // Create blob and download
      const blob = new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success(t('common.success'), 'Invoice downloaded successfully')
    } catch (err) {
      error(t('common.error'), err instanceof Error ? err.message : '')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Container>
        <Card>
          <EmptyState
            icon={FileText}
            title={t('common.loading')}
          />
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('nav.invoices')}</h1>
      </div>

      {invoicesList.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No invoices found"
            description="Your invoices will appear here once they are generated"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {invoicesList.map((invoice: Invoice) => (
            <Card key={invoice.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {invoice.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        <span className="font-medium">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Issued: {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {t(`status.${invoice.status}`)}
                  </span>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement view functionality
                        console.log('View invoice:', invoice.id)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  )
}

