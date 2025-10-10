import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button, Input, useToast, useTranslation, auth, cases, interview } from '@l4h/shared-ui'
import { SearchableSelect, SearchableSelectOption } from '@l4h/shared-ui'
import { useQuery } from '@tanstack/react-query'

interface ProfileCompletionFormData {
  country: string
  stateProvince?: string
  streetAddress: string
  city: string
  postalCode: string
  nationality: string
  dateOfBirth: string
  maritalStatus: string
  gender: string
  guardianEmails: string[]
}

interface Country {
  id: number
  iso2: string
  iso3: string
  name: string
  isActive: boolean
}

interface USSubdivision {
  id: number
  code: string
  name: string
  isState: boolean
  isTerritory: boolean
}

const ProfileCompletionPage: React.FC = () => {
  const { t } = useTranslation(['auth', 'common'])
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedNationality, setSelectedNationality] = useState<string>('')
  const [isUnder18, setIsUnder18] = useState(false)
  const [guardianEmails, setGuardianEmails] = useState<string[]>([''])

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileCompletionFormData>()

  const dateOfBirth = watch('dateOfBirth')

  // Fetch countries
  const { data: countries = [], isLoading: countriesLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await fetch('/api/v1/countries')
      if (!response.ok) throw new Error('Failed to fetch countries')
      return response.json() as Promise<Country[]>
    }
  })

  // Fetch US subdivisions when USA is selected
  const { data: usStates = [], isLoading: statesLoading } = useQuery({
    queryKey: ['us-states'],
    queryFn: async () => {
      const response = await fetch('/api/v1/countries/us/subdivisions')
      if (!response.ok) throw new Error('Failed to fetch US states')
      return response.json() as Promise<USSubdivision[]>
    },
    enabled: selectedCountry === 'US'
  })

  // Check if user is under 18 based on date of birth
  useEffect(() => {
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        setIsUnder18(age - 1 < 18)
      } else {
        setIsUnder18(age < 18)
      }
    } else {
      setIsUnder18(false)
    }
  }, [dateOfBirth])

  // Prepare country options
  const countryOptions: SearchableSelectOption[] = countries.map(country => ({
    value: country.iso2,
    label: country.name,
    iso2: country.iso2,
    iso3: country.iso3
  }))

  // Prepare US state options
  const stateOptions: SearchableSelectOption[] = usStates.map(state => ({
    value: state.code,
    label: state.name
  }))

  const isUSA = selectedCountry === 'US'

  // Determine date format based on selected country
  const getDateFormat = (countryCode: string) => {
    // Countries that use DD/MM/YYYY format
    const ddmmCountries = ['FR', 'GB', 'DE', 'IT', 'ES', 'AU', 'NZ', 'IN', 'ZA', 'IE', 'NL', 'BE', 'PT', 'GR', 'AT', 'CH', 'DK', 'SE', 'NO', 'FI']

    // Countries that use YYYY/MM/DD format
    const yyyymmCountries = ['JP', 'KR', 'CN', 'TW', 'HK', 'MO', 'LT', 'HU']

    if (ddmmCountries.includes(countryCode)) {
      return { format: 'DD/MM/YYYY', placeholder: 'DD/MM/YYYY' }
    } else if (yyyymmCountries.includes(countryCode)) {
      return { format: 'YYYY/MM/DD', placeholder: 'YYYY/MM/DD' }
    } else {
      // Default to US format MM/DD/YYYY
      return { format: 'MM/DD/YYYY', placeholder: 'MM/DD/YYYY' }
    }
  }

  const dateFormat = getDateFormat(selectedCountry)
  const isEuropeanDateFormat = dateFormat.format === 'DD/MM/YYYY'

  const maritalStatusOptions = [
    { value: 'Single', label: t('single', { defaultValue: 'Single' }) },
    { value: 'Married', label: t('married', { defaultValue: 'Married' }) },
    { value: 'Divorced', label: t('divorced', { defaultValue: 'Divorced' }) },
    { value: 'Widowed', label: t('widowed', { defaultValue: 'Widowed' }) }
  ]

  const addGuardianEmail = () => {
    if (guardianEmails.length < 4) {
      setGuardianEmails([...guardianEmails, ''])
    }
  }

  const removeGuardianEmail = (index: number) => {
    const newEmails = guardianEmails.filter((_, i) => i !== index)
    setGuardianEmails(newEmails.length > 0 ? newEmails : [''])
  }

  const updateGuardianEmail = (index: number, email: string) => {
    const newEmails = [...guardianEmails]
    newEmails[index] = email
    setGuardianEmails(newEmails)
  }

  const onSubmit = async (data: ProfileCompletionFormData) => {
    setLoading(true)
    setError('')

    try {
      // Prepare profile data
      let dateOfBirthISO: string | undefined = undefined
      if (data.dateOfBirth) {
        if (isEuropeanDateFormat) {
          // Parse DD/MM/YYYY format
          const match = data.dateOfBirth.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
          if (match) {
            const [, day, month, year] = match
            const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            dateOfBirthISO = birthDate.toISOString()
          }
        } else {
          // Use standard date parsing for non-European formats
          dateOfBirthISO = new Date(data.dateOfBirth).toISOString()
        }
      }

      const profileData = {
        streetAddress: data.streetAddress,
        city: data.city,
        stateProvince: isUSA ? selectedState : '',
        postalCode: data.postalCode,
        country: selectedCountry,
        nationality: selectedNationality,
        dateOfBirth: dateOfBirthISO,
        maritalStatus: data.maritalStatus,
        gender: data.gender
      }

      // Update profile
      await auth.updateProfile(profileData)

      // If user is under 18 and has guardian emails, send invitations
      if (isUnder18) {
        const validGuardianEmails = guardianEmails.filter(email =>
          email.trim() && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.trim())
        )

        if (validGuardianEmails.length > 0) {
          try {
            await fetch('/api/v1/guardian/invitations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ guardianEmails: validGuardianEmails })
            })
          } catch (inviteError) {
            console.warn('Failed to send guardian invitations:', inviteError)
            // Don't block registration if invitations fail
          }
        }
      }

      success(t('profileCompleted', { defaultValue: 'Profile completed successfully!' }))
      await startInterviewSession()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('profileCompletionFailed', { defaultValue: 'Failed to complete profile. Please try again.' })
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    await startInterviewSession()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {t('completeProfile', { defaultValue: 'Complete Your Profile' })}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('profileCompletionDescription', { defaultValue: 'Help us serve you better by completing your profile information.' })}
          </p>
        </div>
        
        <form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
          role="form"
          aria-label="Profile completion form"
        >
          <div className="space-y-4">
            {/* Country of Residence */}
            <SearchableSelect
              label={t('countryOfResidence', { defaultValue: 'Country of Residence' })}
              placeholder={t('selectCountry', { defaultValue: 'Search and select your country...' })}
              options={countryOptions}
              value={selectedCountry}
              onChange={(value) => {
                setSelectedCountry(value || '')
                setValue('country', value || '')
                if (value !== 'US') {
                  setSelectedState('')
                  setValue('stateProvince', '')
                }
              }}
              loading={countriesLoading}
              required
              noOptionsMessage={t('noCountriesFound', { defaultValue: 'No countries found' })}
            />

            {/* US State/Territory (only if USA is selected) */}
            {isUSA && (
              <SearchableSelect
                label={t('stateTerritory', { defaultValue: 'State/Territory' })}
                placeholder={t('selectState', { defaultValue: 'Search and select your state...' })}
                options={stateOptions}
                value={selectedState}
                onChange={(value) => {
                  setSelectedState(value || '')
                  setValue('stateProvince', value || '')
                }}
                loading={statesLoading}
                required
                noOptionsMessage={t('noStatesFound', { defaultValue: 'No states found' })}
              />
            )}

            <Input
              label={t('streetAddress', { defaultValue: 'Street Address' })}
              type="text"
              autoComplete="street-address"
              placeholder={t('streetAddress', { defaultValue: 'Street Address' })}
              error={errors.streetAddress?.message}
              {...register('streetAddress', {
                required: t('streetAddressRequired', { defaultValue: 'Street address is required' }),
              })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('city', { defaultValue: 'City' })}
                type="text"
                autoComplete="address-level2"
                placeholder={t('city', { defaultValue: 'City' })}
                error={errors.city?.message}
                {...register('city', {
                  required: t('cityRequired', { defaultValue: 'City is required' }),
                })}
              />

              <Input
                label={t('postalCode', { defaultValue: 'Postal Code' })}
                type="text"
                autoComplete="postal-code"
                placeholder={t('postalCode', { defaultValue: 'Postal Code' })}
                error={errors.postalCode?.message}
                {...register('postalCode', {
                  required: t('postalCodeRequired', { defaultValue: 'Postal code is required' }),
                })}
              />
            </div>

            {/* Passport Country */}
            <SearchableSelect
              label={t('passportCountry', { defaultValue: 'Passport Country (Nationality)' })}
              placeholder={t('selectPassportCountry', { defaultValue: 'Search and select your passport country...' })}
              options={countryOptions}
              value={selectedNationality}
              onChange={(value) => {
                setSelectedNationality(value || '')
                setValue('nationality', value || '')
              }}
              loading={countriesLoading}
              required
              noOptionsMessage={t('noCountriesFound', { defaultValue: 'No countries found' })}
            />

            {/* Date of Birth with localized format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('dateOfBirth', { defaultValue: 'Date of Birth' })}
                <span className="text-red-500 ml-1">*</span>
                <span className="text-xs text-gray-500 ml-2">({dateFormat.placeholder})</span>
              </label>
              {isEuropeanDateFormat ? (
                <Input
                  type="text"
                  placeholder={dateFormat.placeholder}
                  autoComplete="bday"
                  error={errors.dateOfBirth?.message}
                  {...register('dateOfBirth', {
                    required: t('dateOfBirthRequired', { defaultValue: 'Date of birth is required' }),
                    pattern: {
                      value: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
                      message: t('dateOfBirthInvalid', { defaultValue: `Please enter date in ${dateFormat.placeholder} format` })
                    },
                    validate: (value) => {
                      // Parse DD/MM/YYYY format
                      const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
                      if (!match) return t('dateOfBirthInvalid', { defaultValue: `Please enter date in ${dateFormat.placeholder} format` })

                      const [, day, month, year] = match
                      const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                      const today = new Date()

                      // Validate the date is real
                      if (birthDate.getDate() !== parseInt(day) ||
                          birthDate.getMonth() !== parseInt(month) - 1 ||
                          birthDate.getFullYear() !== parseInt(year)) {
                        return t('dateOfBirthInvalid', { defaultValue: 'Please enter a valid date' })
                      }

                      const age = today.getFullYear() - birthDate.getFullYear()
                      if (age > 150) return t('dateOfBirthTooOld', { defaultValue: 'Please enter a valid date of birth' })
                      if (birthDate > today) return t('dateOfBirthFuture', { defaultValue: 'Date of birth cannot be in the future' })
                      return true
                    }
                  })}
                />
              ) : (
                <Input
                  type="date"
                  error={errors.dateOfBirth?.message}
                  {...register('dateOfBirth', {
                    required: t('dateOfBirthRequired', { defaultValue: 'Date of birth is required' }),
                    validate: (value) => {
                      const birthDate = new Date(value)
                      const today = new Date()
                      const age = today.getFullYear() - birthDate.getFullYear()
                      if (age > 150) return t('dateOfBirthTooOld', { defaultValue: 'Please enter a valid date of birth' })
                      if (birthDate > today) return t('dateOfBirthFuture', { defaultValue: 'Date of birth cannot be in the future' })
                      return true
                    }
                  })}
                />
              )}
            </div>

            {/* Marital Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('maritalStatus', { defaultValue: 'Marital Status' })}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-400 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                {...register('maritalStatus', {
                  required: t('maritalStatusRequired', { defaultValue: 'Marital status is required' })
                })}
              >
                <option value="">{t('selectMaritalStatus', { defaultValue: 'Select marital status...' })}</option>
                {maritalStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.maritalStatus && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.maritalStatus.message}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('gender', { defaultValue: 'Gender' })}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-400 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                {...register('gender', {
                  required: t('genderRequired', { defaultValue: 'Gender is required' })
                })}
              >
                <option value="">{t('selectGender', { defaultValue: 'Select gender...' })}</option>
                <option value="Male">{t('male', { defaultValue: 'Male' })}</option>
                <option value="Female">{t('female', { defaultValue: 'Female' })}</option>
                <option value="Other">{t('other', { defaultValue: 'Other' })}</option>
                <option value="PreferNotToSay">{t('preferNotToSay', { defaultValue: 'Prefer not to say' })}</option>
              </select>
              {errors.gender && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.gender.message}
                </p>
              )}
            </div>

            {/* Guardian Emails (only if under 18) */}
            {isUnder18 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('guardianEmails', { defaultValue: 'Parent/Guardian Email Addresses' })}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('guardianEmailsNote', { defaultValue: 'Guardians will receive invitations to view your case' })}
                  </p>
                </div>
                {guardianEmails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder={`${t('guardianEmail', { defaultValue: 'Guardian Email' })} ${index + 1}`}
                      value={email}
                      onChange={(e) => updateGuardianEmail(index, e.target.value)}
                      className="flex-1"
                      required={index === 0}
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeGuardianEmail(index)}
                        className="px-3"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                {guardianEmails.length < 4 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addGuardianEmail}
                    className="text-blue-600 dark:text-blue-400"
                  >
                    + {t('addGuardianEmail', { defaultValue: 'Add Another Guardian Email' })}
                  </Button>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              loading={loading}
              disabled={loading || !selectedCountry || !selectedNationality}
              className="w-full"
            >
              {t('completeProfile', { defaultValue: 'Complete Profile' })}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              className="w-full"
              disabled={loading}
            >
              {t('skipForNow', { defaultValue: 'Skip for now' })}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileCompletionPage