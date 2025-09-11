import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button, Input, LanguageSwitcher, auth, setJwtToken, useToast, useTranslation } from '@l4h/shared-ui'

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
        success(t('auth.login') + ' ' + t('common.success'))
        if (onSuccess) {
          onSuccess()
        } else {
          navigate('/dashboard')
        }
      } else {
        setError(t('auth.loginFailed'))
        showError(t('auth.loginFailed'))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.loginFailed')
      setError(errorMessage)
      showError(t('auth.loginFailed'), errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('title', { ns: 'login' })}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
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
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              {...register('remember')}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
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
            <p className="text-sm text-gray-600">
              {t('dontHaveAccount', { ns: 'auth' })} {' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-medium text-blue-600 hover:text-blue-500"
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
