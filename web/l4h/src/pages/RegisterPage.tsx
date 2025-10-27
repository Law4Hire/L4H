import React, { useState, useCallback } from 'react'
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
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [userExists, setUserExists] = useState(false)
  const [emailChecked, setEmailChecked] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>()

  const password = watch('password')

  const checkEmailExists = useCallback(async (email: string) => {
    if (!email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      return
    }

    setCheckingEmail(true)
    try {
      const response = await fetch(`/api/v1/auth/check-email?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        setUserExists(data.exists)
        setEmailChecked(true)
      }
    } catch (err) {
      console.warn('Failed to check email:', err)
    } finally {
      setCheckingEmail(false)
    }
  }, [])

  const handleEmailBlur = useCallback((email: string) => {
    checkEmailExists(email)
  }, [checkEmailExists])

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setError('')

    try {
      let result
      
      if (userExists) {
        // User exists, attempt login
        result = await auth.login({
          email: data.email,
          password: data.password
        })
        
        if (result && result.token) {
          setJwtToken(result.token)
          // Dispatch custom event to notify auth state change
          window.dispatchEvent(new Event('jwt-token-changed'))
          success(t('loginSuccess', { ns: 'auth' }))
          if (onSuccess) {
            onSuccess()
          } else {
            // Check if profile is complete, redirect accordingly
            if (result.isProfileComplete === false) {
              navigate('/profile-completion')
            } else {
              navigate('/dashboard')
            }
          }
        } else {
          setError(t('loginFailed', { ns: 'auth' }))
          showError(t('loginFailed', { ns: 'auth' }))
        }
      } else {
        // New user, attempt signup
        result = await auth.signup({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password
        })
        
        if (result && result.token) {
          setJwtToken(result.token)
          // Dispatch custom event to notify auth state change
          window.dispatchEvent(new Event('jwt-token-changed'))
          success(t('registrationSuccess', { ns: 'auth' }))
          if (onSuccess) {
            onSuccess()
          } else {
            // New signups should always go to profile completion
            // But check the flag just in case
            if (result.isProfileComplete === false) {
              navigate('/profile-completion')
            } else {
              navigate('/dashboard')
            }
          }
        } else {
          setError(t('registrationFailed', { ns: 'auth' }))
          showError(t('registrationFailed', { ns: 'auth' }))
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : userExists ? t('loginFailed', { ns: 'auth' }) : t('registrationFailed', { ns: 'auth' })
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {userExists ? t('welcomeBack', { ns: 'auth' }) : t('createAccount', { ns: 'auth' })}
          </h2>
          {!userExists && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('alreadyHaveAccount', { ns: 'auth' })} {' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {t('register.signIn', { ns: 'auth' })}
              </button>
            </p>
          )}
        </div>
        
        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit(onSubmit)}
          role="form"
          aria-label={userExists ? "Login form" : "Registration form"}
        >
          <div className="space-y-4">
            {!userExists && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('firstName', { ns: 'auth' })}
                  type="text"
                  autoComplete="given-name"
                  placeholder={t('firstName', { ns: 'auth' })}
                  error={errors.firstName?.message}
                  {...register('firstName', {
                    required: !userExists ? t('firstNameRequired', { ns: 'auth' }) : false,
                  })}
                />

                <Input
                  label={t('lastName', { ns: 'auth' })}
                  type="text"
                  autoComplete="family-name"
                  placeholder={t('lastName', { ns: 'auth' })}
                  error={errors.lastName?.message}
                  {...register('lastName', {
                    required: !userExists ? t('lastNameRequired', { ns: 'auth' }) : false,
                  })}
                />
              </div>
            )}
            
            <Input
              label={t('email', { ns: 'auth' })}
              type="email"
              autoComplete="email"
              placeholder={t('email', { ns: 'auth' })}
              error={errors.email?.message}
              {...register('email', {
                required: t('emailRequired', { ns: 'auth' }),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('emailInvalid', { ns: 'auth' }),
                },
                onBlur: (e) => handleEmailBlur(e.target.value)
              })}
            />

            {checkingEmail && (
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {t('checkingEmail', { ns: 'auth' })}
              </div>
            )}

            {emailChecked && userExists && (
              <div className="text-sm text-green-600 dark:text-green-400 text-center">
                {t('welcomeBack', { ns: 'auth' })}
              </div>
            )}

            <Input
              label={t('password', { ns: 'auth' })}
              type="password"
              autoComplete={userExists ? "current-password" : "new-password"}
              placeholder={t('password', { ns: 'auth' })}
              error={errors.password?.message}
              {...register('password', {
                required: t('passwordRequired', { ns: 'auth' }),
                minLength: userExists ? undefined : {
                  value: 8,
                  message: t('passwordTooShort', { ns: 'auth' }),
                },
                pattern: userExists ? undefined : {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
                  message: t('passwordNeedsSpecialChar', { ns: 'auth' }),
                },
              })}
            />

            {!userExists && (
              <Input
                label={t('confirmPassword', { ns: 'auth' })}
                type="password"
                autoComplete="new-password"
                placeholder={t('confirmPassword', { ns: 'auth' })}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: t('passwordConfirmRequired', { ns: 'auth' }),
                  validate: (value) =>
                    value === password || t('passwordsDoNotMatch', { ns: 'auth' }),
                })}
              />
            )}
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
              {userExists ? t('login.submit', { ns: 'auth' }) : t('signup', { ns: 'auth' })}
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