import React, { useState, useEffect } from 'react'
import { Card, Button, Input, useToast } from '../index'
import { Settings, Save, RefreshCw, Globe, Shield, CreditCard, Layout } from 'lucide-react'
import { useSiteConfig } from '../hooks/useSiteConfig'

export const SettingsHub: React.FC = () => {
  const { siteConfig, isLoading, updateSiteConfig } = useSiteConfig()
  const [activeTab, setActiveTab] = useState<'general' | 'l4h' | 'cannlaw'>('general')
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
    uniqueSellingPoints: '',
    exchangeTenantId: '',
    exchangeClientId: '',
    exchangeClientSecret: '',
    exchangeSystemEmail: '',
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    roundBillingUp: false
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
        uniqueSellingPoints: siteConfig.uniqueSellingPoints || '',
        exchangeTenantId: siteConfig.exchangeTenantId || '',
        exchangeClientId: siteConfig.exchangeClientId || '',
        exchangeClientSecret: siteConfig.exchangeClientSecret || '',
        exchangeSystemEmail: siteConfig.exchangeSystemEmail || '',
        stripePublishableKey: siteConfig.stripePublishableKey || '',
        stripeSecretKey: siteConfig.stripeSecretKey || '',
        stripeWebhookSecret: siteConfig.stripeWebhookSecret || '',
        roundBillingUp: siteConfig.roundBillingUp || false
      })
    }
  }, [siteConfig])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({ ...prev, [name]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await updateSiteConfig(formData)
      if (result.success) {
        success('Settings updated successfully')
      } else {
        error(result.error || 'Failed to update settings')
      }
    } catch (err) {
      error('Failed to update settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="animate-spin h-10 w-10 text-primary-600" />
        <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'l4h', label: 'Law4Hire / Integrations', icon: CreditCard },
    { id: 'cannlaw', label: 'Cannlaw Specific', icon: Layout }
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unified Settings Hub</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage platform-wide configuration and firm details</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Firm Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Firm Name" name="firmName" value={formData.firmName} onChange={handleInputChange} required />
                <Input label="Managing Attorney" name="managingAttorney" value={formData.managingAttorney} onChange={handleInputChange} />
                <Input label="Primary Phone" name="primaryPhone" type="tel" value={formData.primaryPhone} onChange={handleInputChange} required />
                <Input label="Corporate Phone" name="corporatePhone" type="tel" value={formData.corporatePhone} onChange={handleInputChange} />
                <Input label="Public Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                <Input label="Logo URL" name="logoUrl" type="url" value={formData.logoUrl} onChange={handleInputChange} />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Firm Mission & Branding</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Focus Statement</label>
                  <textarea
                    name="primaryFocusStatement"
                    rows={3}
                    value={formData.primaryFocusStatement}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Locations (JSON)</label>
                  <textarea
                    name="locations"
                    rows={4}
                    value={formData.locations}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded font-mono text-sm dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'l4h' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Stripe Payments
              </h2>
              <div className="space-y-4">
                <Input label="Publishable Key" name="stripePublishableKey" value={formData.stripePublishableKey} onChange={handleInputChange} />
                <Input label="Secret Key" name="stripeSecretKey" type="password" value={formData.stripeSecretKey} onChange={handleInputChange} />
                <Input label="Webhook Secret" name="stripeWebhookSecret" type="password" value={formData.stripeWebhookSecret} onChange={handleInputChange} />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Microsoft Graph / Exchange
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Tenant ID" name="exchangeTenantId" value={formData.exchangeTenantId} onChange={handleInputChange} />
                <Input label="Client ID" name="exchangeClientId" value={formData.exchangeClientId} onChange={handleInputChange} />
                <div className="md:col-span-2">
                  <Input label="Client Secret" name="exchangeClientSecret" type="password" value={formData.exchangeClientSecret} onChange={handleInputChange} />
                </div>
                <Input label="System Email" name="exchangeSystemEmail" type="email" value={formData.exchangeSystemEmail} onChange={handleInputChange} />
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'cannlaw' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Cannlaw Specific Rules</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="roundBillingUp"
                    name="roundBillingUp"
                    checked={formData.roundBillingUp}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600"
                  />
                  <label htmlFor="roundBillingUp" className="text-sm font-medium">Round Billing Up to Nearest 15 Minutes</label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Social Media Platforms (JSON)</label>
                  <textarea
                    name="socialMediaPlatforms"
                    rows={4}
                    value={formData.socialMediaPlatforms}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded font-mono text-sm dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unique Selling Points (JSON)</label>
                  <textarea
                    name="uniqueSellingPoints"
                    rows={4}
                    value={formData.uniqueSellingPoints}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded font-mono text-sm dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="flex justify-end gap-4 pb-10">
          <Button type="button" variant="ghost" onClick={() => window.location.reload()}>Reset</Button>
          <Button type="submit" variant="primary" loading={isSubmitting} className="px-8">
            <Save className="w-4 h-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
