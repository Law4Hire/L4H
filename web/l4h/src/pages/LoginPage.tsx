import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Button, Input, LanguageSwitcher, authClient } from '@l4h/shared-ui'

interface LoginFormData {
  email: string
  password: string
  remember: boolean
}

const LoginPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
      const result = await authClient.login(data.email, data.password)
      
      if (result.success) {
        if (data.remember) {
          await authClient.remember()
        }
        navigate('/dashboard')
      } else {
        setError(result.error || t('login.loginFailed'))
      }
    } catch (err) {
      setError(t('login.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('login.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('login.subtitle')}
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
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              placeholder={t('auth.email')}
              error={errors.email?.message}
              {...register('email', {
                required: t('auth.emailRequired') || 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('auth.emailInvalid') || 'Invalid email format',
                },
              })}
            />
            
            <Input
              label={t('auth.password')}
              type="password"
              autoComplete="current-password"
              placeholder={t('auth.password')}
              error={errors.password?.message}
              {...register('password', {
                required: t('auth.passwordRequired') || 'Password is required',
                minLength: {
                  value: 6,
                  message: t('auth.passwordMinLength') || 'Password must be at least 6 characters',
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
              {t('auth.remember')}
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
              {t('auth.login')}
            </Button>
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
