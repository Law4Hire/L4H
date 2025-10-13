import React, { useState, useEffect } from 'react'
import { Card, Button, Input } from '@l4h/shared-ui'
import { useSiteConfig } from '../../hooks/useSiteConfig'

const SiteConfigPage: React.FC = () => {
  const { siteConfig, isLoading, updateSiteConfig } = useSiteConfig()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const [formData, setFormData] = useState({
    firmName: '',
    managingAttorney: '',
    primaryPhone: '',
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
    setSubmitStatus('idle')

    try {
      const result = await updateSiteConfig(formData)
      if (result.success) {
        setSubmitStatus('success')
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Site Configuration</h1>
        <p className="text-gray-600">Manage your firm's information and website content</p>
      </div>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">Site configuration updated successfully!</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Failed to update site configuration. Please try again.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firmName" className="block text-sm font-medium text-gray-700 mb-1">
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
              />
            </div>

            <div>
              <label htmlFor="managingAttorney" className="block text-sm font-medium text-gray-700 mb-1">
                Managing Attorney
              </label>
              <Input
                id="managingAttorney"
                name="managingAttorney"
                type="text"
                value={formData.managingAttorney}
                onChange={handleInputChange}
                placeholder="Denise S. Cann"
              />
            </div>

            <div>
              <label htmlFor="primaryPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Primary Phone *
              </label>
              <Input
                id="primaryPhone"
                name="primaryPhone"
                type="tel"
                required
                value={formData.primaryPhone}
                onChange={handleInputChange}
                placeholder="(410) 783-1888"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <Input
                id="logoUrl"
                name="logoUrl"
                type="url"
                value={formData.logoUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </Card>

        {/* Primary Focus Statement */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Primary Focus Statement</h2>
          <div>
            <label htmlFor="primaryFocusStatement" className="block text-sm font-medium text-gray-700 mb-1">
              Mission Statement
            </label>
            <textarea
              id="primaryFocusStatement"
              name="primaryFocusStatement"
              rows={3}
              value={formData.primaryFocusStatement}
              onChange={handleInputChange}
              placeholder="Fast, efficient, and convenient. Comprehensive representation from state side through consular processing."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </Card>

        {/* Office Locations */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Office Locations</h2>
          <div>
            <label htmlFor="locations" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter office locations in JSON format. Each location should have at least "city" and "type" fields.
            </p>
          </div>
        </Card>

        {/* Social Media Platforms */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media & Communication</h2>
          <div>
            <label htmlFor="socialMediaPlatforms" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter social media platforms and communication methods in JSON array format.
            </p>
          </div>
        </Card>

        {/* Unique Selling Points */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Unique Selling Points</h2>
          <div>
            <label htmlFor="uniqueSellingPoints" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter unique selling points and key benefits in JSON array format.
            </p>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Reset Changes
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="px-8"
          >
            {isSubmitting ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </form>

      {/* Preview Section */}
      <Card className="p-6 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
        <div className="space-y-4 text-sm">
          <div>
            <strong>Firm Name:</strong> {formData.firmName || 'Not set'}
          </div>
          <div>
            <strong>Managing Attorney:</strong> {formData.managingAttorney || 'Not set'}
          </div>
          <div>
            <strong>Contact:</strong> {formData.primaryPhone || 'Not set'} | {formData.email || 'Not set'}
          </div>
          <div>
            <strong>Focus Statement:</strong> {formData.primaryFocusStatement || 'Not set'}
          </div>
          {formData.locations && (
            <div>
              <strong>Locations:</strong>
              <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                {formData.locations}
              </pre>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default SiteConfigPage