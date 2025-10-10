import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Container, Card, Button, EmptyState } from '@l4h/shared-ui'
import { auth, useToast, useTranslation } from '@l4h/shared-ui'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

function VerifyPageContent() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error } = useToast()
  const { t } = useTranslation(['auth', 'common', 'nav'])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(t('error', { ns: 'common', defaultValue: 'Error' }))
      return
    }

    const verifyEmail = async () => {
      try {
        await auth.verify(token)
        setStatus('success')
        setMessage(t('emailVerified', { ns: 'auth', defaultValue: 'Email verified' }))
        success(t('emailVerified', { ns: 'auth', defaultValue: 'Email verified' }))

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      } catch (err) {
        setStatus('error')
        setMessage(t('error', { ns: 'common', defaultValue: 'Error' }))
        error(t('error', { ns: 'common', defaultValue: 'Error' }), err instanceof Error ? err.message : '')
      }
    }

    verifyEmail()
  }, [token, success, error, navigate, t])

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
            title={t('loading', { ns: 'common', defaultValue: 'Loading...' })}
            description={t('verifyEmail', { ns: 'auth', defaultValue: 'Verify email' })}
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
              ? t('emailVerified', { ns: 'auth', defaultValue: 'Email verified' })
              : t('error', { ns: 'common', defaultValue: 'Error' })
          }
          action={
            <div className="flex flex-col space-y-2">
              {status === 'success' && (
                <Button onClick={handleGoToDashboard}>
                  {t('dashboard', { ns: 'common', defaultValue: 'Dashboard' })}
                </Button>
              )}
              {status === 'error' && (
                <Button onClick={handleGoToLogin}>
                  {t('login', { ns: 'auth', defaultValue: 'Login' })}
                </Button>
              )}
            </div>
          }
        />
      </Card>
    </Container>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <Container>
        <Card className="max-w-md mx-auto">
          <EmptyState
            icon={Loader2}
            title="Loading..."
            description="Please wait..."
          />
        </Card>
      </Container>
    }>
      <VerifyPageContent />
    </Suspense>
  )
}
