import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button, Input, LanguageSwitcher, auth, setJwtToken, useToast, useTranslation } from '@l4h/shared-ui'

interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

interface RegisterPageProps {
  onSuccess?: () => void
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess }) => {
  const { t } = useTranslation(['auth', 'common'])
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>()

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setError('')

    try {
      const result = await auth.signup({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password
      })
      
      if (result && result.token) {
        setJwtToken(result.token)
        // Dispatch custom event to notify auth state change
        window.dispatchEvent(new Event('jwt-token-changed'))
        success(t('registrationSuccess'))
        if (onSuccess) {
          onSuccess()
        } else {
          navigate('/dashboard')
        }
      } else {
        setError(t('registrationFailed'))
        showError(t('registrationFailed'))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('registrationFailed')
      setError(errorMessage)
      showError(t('registrationFailed'), errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('createAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('alreadyHaveAccount')} {' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t('login')}
            </button>
          </p>
        </div>
        
        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit(onSubmit)}
          role="form"
          aria-label="Registration form"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('firstName')}
                type="text"
                autoComplete="given-name"
                placeholder={t('firstName')}
                error={errors.firstName?.message}
                {...register('firstName', {
                  required: t('firstNameRequired'),
                })}
              />
              
              <Input
                label={t('lastName')}
                type="text"
                autoComplete="family-name"
                placeholder={t('lastName')}
                error={errors.lastName?.message}
                {...register('lastName', {
                  required: t('lastNameRequired'),
                })}
              />
            </div>
            
            <Input
              label={t('email')}
              type="email"
              autoComplete="email"
              placeholder={t('email')}
              error={errors.email?.message}
              {...register('email', {
                required: t('emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('emailInvalid'),
                },
              })}
            />
            
            <Input
              label={t('password')}
              type="password"
              autoComplete="new-password"
              placeholder={t('password')}
              error={errors.password?.message}
              {...register('password', {
                required: t('passwordRequired'),
                minLength: {
                  value: 8,
                  message: t('passwordTooShort'),
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message: t('passwordNeedsSpecialChar'),
                },
              })}
            />
            
            <Input
              label={t('confirmPassword')}
              type="password"
              autoComplete="new-password"
              placeholder={t('confirmPassword')}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: t('passwordConfirmRequired'),
                validate: (value) =>
                  value === password || t('passwordsDoNotMatch'),
              })}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center" role="alert">
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
              {t('signup')}
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

export default RegisterPage