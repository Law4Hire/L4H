import React from 'react'
import { Layout } from '@l4h/shared-ui'
import { useAuth } from '../hooks/useAuth'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

// Cannlaw branding configuration
const cannlawLogo = (
  <div className="flex-shrink-0 mr-2">
    <img 
      src="https://cannlaw.com/images/logo.gif" 
      alt="Cann Legal Group"
      className="h-8 w-auto object-contain dark:brightness-110"
    />
  </div>
)

const layoutProps = {
  brandName: "Cann Legal Group",
  brandSubtitle: "Immigration Law Specialists",
  brandLogo: cannlawLogo
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { user, isAuthenticated } = useAuth()

  return (
    <Layout 
      title={title} 
      user={user} 
      isAuthenticated={isAuthenticated} 
      showAdminLink={false}
      {...layoutProps}
    >
      {children}
    </Layout>
  )
}

export default DashboardLayout
