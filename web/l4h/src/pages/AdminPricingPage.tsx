import React, { useState, useEffect } from 'react'
import { Card, Button, Input, useToast, Modal } from '@l4h/shared-ui'
import { Trash2, X, Search, Filter, Edit } from 'lucide-react'

interface AdminPricingRuleResponse {
  id: number
  packageId: number
  packageCode: string
  packageDisplayName: string
  basePrice: number
  currency: string
  taxRate: number
  fxSurchargeMode?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AdminPackageResponse {
  id: number
  code: string
  displayName: string
  description: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface VisaTypePricing {
  id: number
  code: string
  name: string
  isActive: boolean
  packages: {
    [packageCode: string]: AdminPricingRuleResponse | null
  }
}

const AdminPricingPage: React.FC = () => {
  const [visaTypes, setVisaTypes] = useState<VisaTypePricing[]>([])
  const [packages, setPackages] = useState<AdminPackageResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDisabled, setShowDisabled] = useState(false)
  const [showOnlyUnpriced, setShowOnlyUnpriced] = useState(false)
  const [selectedVisaType, setSelectedVisaType] = useState<VisaTypePricing | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [addingPackage, setAddingPackage] = useState(false)
  const [newRuleData, setNewRuleData] = useState({
    packageId: 0,
    basePrice: '0',
    taxRate: '0'
  })
  const [editingPackage, setEditingPackage] = useState<{
    packageCode: string
    basePrice: string
    taxRate: string
    isActive: boolean
  } | null>(null)
  const { success, error } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('jwt_token')

      if (!token) {
        error('Authentication required')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [vtRes, pkgRes] = await Promise.all([
        fetch('/api/v1/admin/pricing/visa-types', { headers }),
        fetch('/api/v1/admin/pricing/packages', { headers })
      ])

      if (!vtRes.ok || !pkgRes.ok) throw new Error('Failed to load data')

      const vtData = await vtRes.json()
      const pkgData = await pkgRes.json()
      setPackages(pkgData)

      const transformed: VisaTypePricing[] = vtData.map((vt: any) => {
        const pMap: { [code: string]: AdminPricingRuleResponse | null } = {}
        
        // Ensure all packages exist in the map
        pkgData.forEach((p: any) => pMap[p.code] = null)

        if (vt.pricingRules?.length > 0) {
          // Flatten all rules from all countries (taking first found for display)
          vt.pricingRules.forEach((group: any) => {
            group.rules.forEach((r: any) => {
              if (!pMap[r.packageCode]) pMap[r.packageCode] = r
            })
          })
        }
        return {
          id: vt.id,
          code: vt.code,
          name: vt.name,
          isActive: vt.isActive,
          packages: pMap
        }
      })

      setVisaTypes(transformed)
    } catch (err) {
      error('Failed to load pricing')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRule = async () => {
    if (!selectedVisaType || !newRuleData.packageId) return

    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`/api/v1/admin/pricing/visa-types/${selectedVisaType.id}/rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId: newRuleData.packageId,
          basePrice: parseFloat(newRuleData.basePrice),
          taxRate: parseFloat(newRuleData.taxRate) / 100,
          countryCode: 'US',
          currency: 'USD'
        })
      })

      if (response.ok) {
        success('Package association created')
        setAddingPackage(false)
        setNewRuleData({ packageId: 0, basePrice: '0', taxRate: '0' })
        await loadData()
        closeModal()
      } else {
        const data = await response.json()
        error(data.title || 'Failed to add')
      }
    } catch (err) {
      error('Error adding pricing')
    }
  }

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Remove this package from this visa type?')) return
    try {
      const token = localStorage.getItem('jwt_token')
      const res = await fetch(`/api/v1/admin/pricing/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        success('Rule removed')
        await loadData()
        closeModal()
      }
    } catch (err) { error('Failed to delete') }
  }

  const savePackage = async () => {
    if (!editingPackage || !selectedVisaType) return
    try {
      const token = localStorage.getItem('jwt_token')
      const rule = selectedVisaType.packages[editingPackage.packageCode]
      if (!rule) return

      const response = await fetch(`/api/v1/admin/pricing/visa-types/${selectedVisaType.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pricingRuleUpdates: [{
            id: rule.id,
            basePrice: parseFloat(editingPackage.basePrice),
            taxRate: parseFloat(editingPackage.taxRate) / 100,
            isActive: editingPackage.isActive
          }]
        })
      })

      if (response.ok) {
        success('Updated')
        setEditingPackage(null)
        await loadData()
        closeModal()
      }
    } catch (err) { error('Failed to save') }
  }

  const filteredVisaTypes = visaTypes.filter(vt => {
    const matchesSearch = vt.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         vt.name.toLowerCase().includes(searchTerm.toLowerCase())
    const hasPricing = Object.values(vt.packages).some(r => r !== null)
    const matchesUnpriced = !showOnlyUnpriced || !hasPricing
    return matchesSearch && (showDisabled || vt.isActive) && matchesUnpriced
  })

  const openVisaTypeModal = (vt: VisaTypePricing) => {
    setSelectedVisaType(vt)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedVisaType(null)
    setEditingPackage(null)
    setAddingPackage(false)
  }

  const startEditPackage = (code: string, rule: AdminPricingRuleResponse | null) => {
    if (!rule) return
    setEditingPackage({
      packageCode: code,
      basePrice: rule.basePrice.toString(),
      taxRate: (rule.taxRate * 100).toString(),
      isActive: rule.isActive
    })
  }

  if (loading) return <div className="p-8 text-center flex flex-col items-center gap-4"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div> Loading 80+ Visa Types...</div>

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md border dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-serif">Pricing Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure prices for {visaTypes.length} visa types and associate them with service packages.</p>
      </div>

      <Card className="p-4 bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by code (e.g. H-1B) or name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-6 items-center whitespace-nowrap">
            <label className="flex items-center text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" checked={showDisabled} onChange={e => setShowDisabled(e.target.checked)} className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Show Disabled</label>
            <label className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer"><input type="checkbox" checked={showOnlyUnpriced} onChange={e => setShowOnlyUnpriced(e.target.checked)} className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> Missing Price Only</label>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredVisaTypes.map(vt => {
          const pricedCount = Object.values(vt.packages).filter(r => r !== null).length
          return (
            <div 
              key={vt.id} 
              onClick={() => openVisaTypeModal(vt)}
              className={`p-4 rounded-xl border-2 cursor-pointer hover:scale-105 transition-all shadow-sm ${
                pricedCount > 0 
                  ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-400' 
                  : 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/50 hover:border-orange-400'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg text-gray-900 dark:text-white leading-none">{vt.code}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold ${pricedCount > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-orange-100 text-orange-700'}`}>
                  {pricedCount} PKGS
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 h-8 mb-2 leading-tight">{vt.name}</p>
              {!vt.isActive && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-sm font-bold uppercase">Disabled</span>}
            </div>
          )
        })}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={selectedVisaType ? `${selectedVisaType.code} Pricing` : ''} size="lg">
        {selectedVisaType && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 dark:bg-gray-950 p-4 rounded-xl gap-4 border border-gray-100 dark:border-gray-800">
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">{selectedVisaType.name}</div>
                <div className="text-xs text-gray-500">Code: {selectedVisaType.code}</div>
              </div>
              <Button size="sm" onClick={() => setAddingPackage(true)} className="bg-blue-600 hover:bg-blue-700">Add New Association</Button>
            </div>

            {addingPackage && (
              <div className="p-5 border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-xl space-y-4 bg-blue-50/30 dark:bg-blue-900/10">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-900 dark:text-white">Associate New Package Deal</h4>
                  <button onClick={() => setAddingPackage(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Target Package</label>
                    <select 
                      className="w-full p-2.5 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      value={newRuleData.packageId}
                      onChange={e => setNewRuleData({...newRuleData, packageId: parseInt(e.target.value)})}
                    >
                      <option value="0">Select from list...</option>
                      {packages.filter(p => !selectedVisaType.packages[p.code]).map(p => (
                        <option key={p.id} value={p.id}>{p.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Base Price (USD)</label>
                    <Input type="number" placeholder="0.00" value={newRuleData.basePrice} onChange={e => setNewRuleData({...newRuleData, basePrice: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setAddingPackage(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleAddRule} disabled={!newRuleData.packageId || parseFloat(newRuleData.basePrice) <= 0}>Create Association</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {Object.entries(selectedVisaType.packages).filter(([_, r]) => r !== null).map(([code, rule]) => {
                const pkg = packages.find(p => p.code === code)
                return (
                  <div key={code} className="p-4 border dark:border-gray-800 rounded-xl flex justify-between items-center bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-gray-900 dark:text-white leading-tight">{pkg?.displayName || code}</div>
                        {rule?.isActive === false && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded uppercase font-bold">Inactive</span>}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{pkg?.description}</div>
                      <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums tracking-tighter">${rule?.basePrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                    <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" onClick={() => startEditPackage(code, rule)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 border-blue-100 dark:border-blue-900/50">
                        <Edit size={16} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rule && handleDeleteRule(rule.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-100 dark:border-red-900/50">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                )
              })}
              {Object.values(selectedVisaType.packages).every(r => r === null) && (
                <div className="py-12 text-center text-gray-400 italic border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                  No packages currently associated with this visa type.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Package Modal */}
      <Modal open={!!editingPackage} onClose={() => setEditingPackage(null)} title="Edit Pricing">
        {editingPackage && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Base Price (USD)"
                type="number"
                value={editingPackage.basePrice}
                onChange={e => setEditingPackage({...editingPackage, basePrice: e.target.value})}
              />
              <Input
                label="Tax Rate %"
                type="number"
                value={editingPackage.taxRate}
                onChange={e => setEditingPackage({...editingPackage, taxRate: e.target.value})}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingPackage.isActive}
                  onChange={e => setEditingPackage({...editingPackage, isActive: e.target.checked})}
                  className="w-4 h-4"
                />
                <label>Is Active</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditingPackage(null)}>Cancel</Button>
              <Button onClick={savePackage}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminPricingPage
