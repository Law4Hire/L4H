import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button, Input, setJwtToken, useToast, cases, interview, useAuth } from '@l4h/shared-ui'

interface LoginFormData {
  email: string
  password: string
  remember: boolean
}

interface LoginPageProps {
  onSuccess?: () => void
}

const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
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
      // Get user's case
      const userCases = await cases.mine()

      if (!userCases || userCases.length === 0) {
        showError('No case found. Please contact support.')
        navigate('/dashboard')
        return
      }

      const caseId = userCases[0].id || userCases[0].caseId

      // Start interview session
      const session = await interview.start(caseId)

      if (session && session.sessionId) {
        navigate(`/interview?sessionId=${session.sessionId}`)
      } else {
        showError('Failed to start interview session')
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error starting interview session:', error)
      showError('Failed to start interview session')
      navigate('/dashboard')
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    // Immediately prevent double-submission
    if (loading) return
    
    setLoading(true)
    setError('')
    console.log('[AUTH] Login attempt started for:', data.email)

    try {
      const result = await authLogin(data.email, data.password, data.remember)
      
      console.log('[AUTH] Login result:', result)

      if (result.success) {
        success('Login Success')
        if (onSuccess) {
          onSuccess()
        } else {
          // After successful login, the useAuth hook should have updated the user state
          // Navigate to dashboard - UnifiedDashboard will handle role-based routing
          navigate('/dashboard')
        }
      } else {
        const errorMessage = result.error || 'Login Failed'
        setError(errorMessage)
        showError('Login Failed', errorMessage)
        console.warn('[AUTH] Login failed:', errorMessage)
      }
    } catch (err) {
      console.error('[AUTH] CRITICAL: Login error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Login Failed'
      setError(errorMessage)
      showError('Login Failed', errorMessage)
    } finally {
      setLoading(false)
      console.log('[AUTH] Login attempt finalized')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Login
          </h2>
        </div>
        
        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit(onSubmit)}
          role="form"
          aria-label="Login form"
        >
          <div className="space-y-4">
            <Input
              label='Email'
              type="email"
              autoComplete="email"
              placeholder='Email'
              className="dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#374151] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email format',
                },
              })}
            />
            
            <Input
              label='Password'
              type="password"
              autoComplete="current-password"
              placeholder='Password'
              className="dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#374151] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
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
              Remember me
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
              Login
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account? {' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign up now
              </button>
            </p>
          </div>

          <div className="flex justify-center">
            
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
