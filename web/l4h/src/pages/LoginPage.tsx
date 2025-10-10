import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button, Input, LanguageSwitcher, auth, setJwtToken, useToast, useTranslation, cases, interview } from '@l4h/shared-ui'

interface LoginFormData {
  email: string
  password: string
  remember: boolean
}

interface LoginPageProps {
  onSuccess?: () => void
}

const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { t, i18n } = useTranslation(['login', 'auth', 'common'])
  
  // Use translations from shared i18n system
  const loginTitle = t('title', { ns: 'login', defaultValue: 'Sign In to Law4Hire' })
  const loginSubtitle = t('subtitle', { ns: 'login', defaultValue: 'Access your immigration case portal' })
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const startInterviewSession = async () => {
    try {
      console.log('🔍 Starting interview session...')

      // Get user's case
      const userCases = await cases.mine()
      console.log('🔍 User cases:', userCases)

      if (!userCases || userCases.length === 0) {
        showError('No case found. Please contact support.')
        navigate('/dashboard')
        return
      }

      const caseId = userCases[0].id || userCases[0].caseId
      console.log('🔍 Using caseId:', caseId)

      // Start interview session
      const session = await interview.start(caseId)
      console.log('🔍 Started interview session:', session)

      if (session && session.sessionId) {
        navigate(`/interview?sessionId=${session.sessionId}`)
      } else {
        showError('Failed to start interview session')
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('🔍 Error starting interview session:', error)
      showError('Failed to start interview session')
      navigate('/dashboard')
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')

    try {
      const result = await auth.login({
        email: data.email,
        password: data.password,
        rememberMe: data.remember
      })
      
      if (result && result.token) {
        setJwtToken(result.token)
        // Dispatch custom event to notify auth state change
        window.dispatchEvent(new Event('jwt-token-changed'))
        success(t('login', { ns: 'auth' }) + ' ' + t('success', { ns: 'common' }))
        if (onSuccess) {
          console.log('🔍 Using onSuccess callback instead of redirect logic')
          onSuccess()
        } else {
          // Determine redirect path based on user type and completion status
          if (result.isStaff || result.isAdmin) {
            // Staff and admin users always go to dashboard
            navigate('/dashboard')
          } else if (!result.isProfileComplete) {
            // Regular users with incomplete profile go to profile completion
            navigate('/profile-completion')
          } else if (!result.isInterviewComplete) {
            // Regular users with complete profile but incomplete interview go to interview
            await startInterviewSession()
          } else {
            // Regular users with complete profile and interview go to dashboard
            navigate('/dashboard')
          }
        }
      } else {
        setError(t('loginFailed', { ns: 'auth' }))
        showError(t('loginFailed', { ns: 'auth' }))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('loginFailed', { ns: 'auth' })
      setError(errorMessage)
      showError(t('loginFailed', { ns: 'auth' }), errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {t('title', { ns: 'login' })}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('subtitle', { ns: 'login' })}
          </p>
        </div>
        
        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit(onSubmit)}
          role="form"
          aria-label="Login form"
        >
          <div className="space-y-4">
            <Input
              label={t('email', { ns: 'auth' })}
              type="email"
              autoComplete="email"
              placeholder={t('email', { ns: 'auth' })}
              error={errors.email?.message}
              {...register('email', {
                required: t('emailRequired', { ns: 'auth' }) || 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('emailInvalid', { ns: 'auth' }) || 'Invalid email format',
                },
              })}
            />
            
            <Input
              label={t('password', { ns: 'auth' })}
              type="password"
              autoComplete="current-password"
              placeholder={t('password', { ns: 'auth' })}
              error={errors.password?.message}
              {...register('password', {
                required: t('passwordRequired', { ns: 'auth' }) || 'Password is required',
                minLength: {
                  value: 6,
                  message: t('passwordMinLength', { ns: 'auth' }) || 'Password must be at least 6 characters',
                },
              })}
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
              {...register('remember')}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              {t('remember', { ns: 'auth' })}
            </label>
          </div>

          {error && (
            <div className="text-error-600 text-sm text-center" role="alert">
              {error}
            </div>
          )}

          <div>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="w-full"
            >
              {t('login', { ns: 'auth' })}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('dontHaveAccount', { ns: 'auth' })} {' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('signUpNow', { ns: 'auth' })}
              </button>
            </p>
          </div>

          <div className="flex justify-center">
            <LanguageSwitcher variant="compact" />
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
