import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Container, Card, Button, EmptyState } from '@l4h/shared-ui'
import { auth, useToast } from '@l4h/shared-ui'
import { useTranslation } from 'react-i18next'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function VerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error } = useToast()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(t('auth.verifyEmail') + ' - ' + t('common.error'))
      return
    }

    const verifyEmail = async () => {
      try {
        await auth.verify(token)
        setStatus('success')
        setMessage(t('auth.emailVerified'))
        success(t('auth.emailVerified'))
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      } catch (err) {
        setStatus('error')
        setMessage(t('common.error'))
        error(t('common.error'), err instanceof Error ? err.message : '')
      }
    }

    verifyEmail()
  }, [token, t, success, error, navigate])

  const handleGoToDashboard = () => {
    navigate('/dashboard')
  }

  const handleGoToLogin = () => {
    navigate('/login')
  }

  if (status === 'loading') {
    return (
      <Container>
        <Card className="max-w-md mx-auto">
          <EmptyState
            icon={Loader2}
            title={t('common.loading')}
            description={t('auth.verifyEmail')}
          />
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <Card className="max-w-md mx-auto">
        <EmptyState
          icon={status === 'success' ? CheckCircle : AlertCircle}
          title={message}
          description={
            status === 'success' 
              ? t('auth.emailVerified') 
              : t('common.error')
          }
          action={
            <div className="flex flex-col space-y-2">
              {status === 'success' && (
                <Button onClick={handleGoToDashboard}>
                  {t('nav.dashboard')}
                </Button>
              )}
              {status === 'error' && (
                <Button onClick={handleGoToLogin}>
                  {t('nav.login')}
                </Button>
              )}
            </div>
          }
        />
      </Card>
    </Container>
  )
}

