import React, { useState, useEffect } from 'react'
import { Card, Button, Input, useToast } from '@l4h/shared-ui'
import { Settings, Save, RefreshCw } from 'lucide-react'
import { useSiteConfig } from '../../hooks/useSiteConfig'

const SystemSettingsPage: React.FC = () => {
  const { siteConfig, isLoading, updateSiteConfig } = useSiteConfig()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    firmName: '',
    managingAttorney: '',
    primaryPhone: '',
    corporatePhone: '',
    email: '',
    primaryFocusStatement: '',
    logoUrl: '',
    locations: '',
    socialMediaPlatforms: '',
    uniqueSellingPoints: ''
  })

  useEffect(() => {
    if (siteConfig) {
      setFormData({
        firmName: siteConfig.firmName || '',
        managingAttorney: siteConfig.managingAttorney || '',
        primaryPhone: siteConfig.primaryPhone || '',
        corporatePhone: siteConfig.corporatePhone || '',
        email: siteConfig.email || '',
        primaryFocusStatement: siteConfig.primaryFocusStatement || '',
        logoUrl: siteConfig.logoUrl || '',
        locations: siteConfig.locations || '',
        socialMediaPlatforms: siteConfig.socialMediaPlatforms || '',
        uniqueSellingPoints: siteConfig.uniqueSellingPoints || ''
      })
    }
  }, [siteConfig])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await updateSiteConfig(formData)
      if (result.success) {
        success('System settings updated successfully')
      } else {
        error(result.error || 'Failed to update system settings')
      }
    } catch (err) {
      error('Failed to update system settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-gray-600 dark:text-gray-400">Loading system settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage firm information and website configuration</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firmName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Firm Name *
              </label>
              <Input
                id="firmName"
                name="firmName"
                type="text"
                required
                value={formData.firmName}
                onChange={handleInputChange}
                placeholder="Cann Legal Group"
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label htmlFor="managingAttorney" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Managing Attorney
              </label>
              <Input
                id="managingAttorney"
                name="managingAttorney"
                type="text"
                value={formData.managingAttorney}
                onChange={handleInputChange}
                placeholder="Denise S. Cann"
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label htmlFor="primaryPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Primary Phone *
              </label>
              <Input
                id="primaryPhone"
                name="primaryPhone"
                type="tel"
                required
                value={formData.primaryPhone}
                onChange={handleInputChange}
                placeholder="(410) 988-0123"
                className="dark:bg-gray-700 dark:border-gray-600"
              />
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                This phone number will be displayed throughout the entire platform
              </p>
            </div>

            <div>
              <label htmlFor="corporatePhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Corporate Phone
              </label>
              <Input
                id="corporatePhone"
                name="corporatePhone"
                type="tel"
                value={formData.corporatePhone}
                onChange={handleInputChange}
                placeholder="(410) 988-0123"
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="information@cannlaw.com"
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logo URL
              </label>
              <Input
                id="logoUrl"
                name="logoUrl"
                type="url"
                value={formData.logoUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/logo.png"
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </Card>

        {/* Primary Focus Statement */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Primary Focus Statement</h2>
          <div>
            <label htmlFor="primaryFocusStatement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mission Statement
            </label>
            <textarea
              id="primaryFocusStatement"
              name="primaryFocusStatement"
              rows={3}
              value={formData.primaryFocusStatement}
              onChange={handleInputChange}
              placeholder="Fast, efficient, and convenient. Comprehensive representation from state side through consular processing."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </Card>

        {/* Office Locations */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Office Locations</h2>
          <div>
            <label htmlFor="locations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Locations (JSON Format)
            </label>
            <textarea
              id="locations"
              name="locations"
              rows={6}
              value={formData.locations}
              onChange={handleInputChange}
              placeholder={`[
  {"city": "Baltimore, Maryland", "type": "Primary"},
  {"city": "Martinsburg, West Virginia", "zip": "25403", "type": "USA Office"},
  {"city": "Taichung, Taiwan", "address": "42 Datong Jie, 7th Floor", "type": "International Office"}
]`}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm dark:bg-gray-700 dark:text-gray-300"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter office locations in JSON format. Each location should have at least "city" and "type" fields.
            </p>
          </div>
        </Card>

        {/* Social Media Platforms */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Media & Communication</h2>
          <div>
            <label htmlFor="socialMediaPlatforms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Social Media Platforms (JSON Format)
            </label>
            <textarea
              id="socialMediaPlatforms"
              name="socialMediaPlatforms"
              rows={4}
              value={formData.socialMediaPlatforms}
              onChange={handleInputChange}
              placeholder={`[
  "Facebook",
  "WhatsApp!",
  "LINE",
  "SKYPE: cannlegalgroup"
]`}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm dark:bg-gray-700 dark:text-gray-300"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter social media platforms and communication methods in JSON array format.
            </p>
          </div>
        </Card>

        {/* Unique Selling Points */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Unique Selling Points</h2>
          <div>
            <label htmlFor="uniqueSellingPoints" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key Benefits (JSON Format)
            </label>
            <textarea
              id="uniqueSellingPoints"
              name="uniqueSellingPoints"
              rows={4}
              value={formData.uniqueSellingPoints}
              onChange={handleInputChange}
              placeholder={`[
  "24/7 Round-the-Clock Support",
  "Direct Online Client Access to case status, attorneys, and checklists"
]`}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm dark:bg-gray-700 dark:text-gray-300"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter unique selling points and key benefits in JSON array format.
            </p>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
            className="dark:border-gray-600"
          >
            Reset Changes
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="px-8 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </form>

      {/* Preview Section */}
      <Card className="p-6 bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h2>
        <div className="space-y-4 text-sm">
          <div>
            <strong className="text-gray-900 dark:text-gray-300">Firm Name:</strong>{' '}
            <span className="text-gray-700 dark:text-gray-400">{formData.firmName || 'Not set'}</span>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-300">Managing Attorney:</strong>{' '}
            <span className="text-gray-700 dark:text-gray-400">{formData.managingAttorney || 'Not set'}</span>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-300">Contact:</strong>{' '}
            <span className="text-gray-700 dark:text-gray-400">{formData.primaryPhone || 'Not set'} | {formData.email || 'Not set'}</span>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-gray-300">Focus Statement:</strong>{' '}
            <span className="text-gray-700 dark:text-gray-400">{formData.primaryFocusStatement || 'Not set'}</span>
          </div>
          {formData.locations && (
            <div>
              <strong className="text-gray-900 dark:text-gray-300">Locations:</strong>
              <pre className="mt-1 text-xs bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 overflow-x-auto text-gray-700 dark:text-gray-300">
                {formData.locations}
              </pre>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default SystemSettingsPage
