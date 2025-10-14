import { useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { RTLNumber, RTLDate } from './RTLNumber'
import { useRTL } from '../hooks/useRTL'
import { setRTLDirection } from '../i18n-config'

/**
 * Demo component to test RTL language support
 * This component demonstrates how RTL languages are handled in the UI
 */
export function RTLDemo() {
  const { isRTL, direction, textAlign, getClassName } = useRTL()
  const [currentLanguage, setCurrentLanguage] = useState('en-US')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    amount: 1234.56
  })

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language)
    setRTLDirection(language)
  }

  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'ar-SA', name: 'العربية (Arabic)' },
    { code: 'ur-PK', name: 'اردو (Urdu)' },
    { code: 'fr-FR', name: 'Français' },
    { code: 'es-ES', name: 'Español' }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className={getClassName("text-center", "rtl:text-center")}>
        <h1 className="text-3xl font-bold mb-4">RTL Language Support Demo</h1>
        <p className="text-gray-600 mb-6">
          Current Language: <strong>{currentLanguage}</strong> | 
          Direction: <strong>{direction}</strong> | 
          RTL: <strong>{isRTL ? 'Yes' : 'No'}</strong>
        </p>
      </div>

      {/* Language Switcher */}
      <div className={getClassName("bg-gray-50 p-4 rounded-lg", "interview-form")}>
        <h2 className="text-xl font-semibold mb-4" style={{ textAlign: textAlign() as any }}>
          Language Selection
        </h2>
        <div className={getClassName("flex flex-wrap gap-2", "rtl:flex-row-reverse")}>
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant={currentLanguage === lang.code ? 'primary' : 'outline'}
              onClick={() => handleLanguageChange(lang.code)}
              className="text-sm"
            >
              {lang.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Form Demo */}
      <div className="bg-white p-6 rounded-lg border interview-form">
        <h2 className="text-xl font-semibold mb-6" style={{ textAlign: textAlign() as any }}>
          Form Elements Demo
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label={isRTL ? "الاسم الكامل" : "Full Name"}
              placeholder={isRTL ? "أدخل اسمك الكامل" : "Enter your full name"}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <Input
              label={isRTL ? "البريد الإلكتروني" : "Email Address"}
              type="email"
              placeholder={isRTL ? "أدخل بريدك الإلكتروني" : "Enter your email"}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          
          <div>
            <Input
              label={isRTL ? "رقم الهاتف" : "Phone Number"}
              type="tel"
              placeholder={isRTL ? "أدخل رقم هاتفك" : "Enter your phone number"}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          
          <div>
            <Input
              label={isRTL ? "المبلغ" : "Amount"}
              type="number"
              placeholder="1234.56"
              value={formData.amount.toString()}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6 interview-actions rtl:space-x-reverse rtl:justify-start">
          <Button variant="outline">
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="primary">
            {isRTL ? "حفظ" : "Save"}
          </Button>
        </div>
      </div>

      {/* Number and Date Formatting Demo */}
      <div className={getClassName("bg-blue-50 p-6 rounded-lg", "interview-recommendation")}>
        <h2 className="text-xl font-semibold mb-6" style={{ textAlign: textAlign() as any }}>
          Number & Date Formatting Demo
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3" style={{ textAlign: textAlign() as any }}>
              {isRTL ? "تنسيق الأرقام" : "Number Formatting"}
            </h3>
            <div className="space-y-2">
              <div className={getClassName("flex justify-between", "rtl:flex-row-reverse")}>
                <span>{isRTL ? "رقم عادي:" : "Regular Number:"}</span>
                <RTLNumber value={1234567.89} />
              </div>
              <div className={getClassName("flex justify-between", "rtl:flex-row-reverse")}>
                <span>{isRTL ? "عملة:" : "Currency:"}</span>
                <RTLNumber value={formData.amount} format="currency" currency="USD" />
              </div>
              <div className={getClassName("flex justify-between", "rtl:flex-row-reverse")}>
                <span>{isRTL ? "نسبة مئوية:" : "Percentage:"}</span>
                <RTLNumber value={0.75} format="percent" />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3" style={{ textAlign: textAlign() as any }}>
              {isRTL ? "تنسيق التاريخ" : "Date Formatting"}
            </h3>
            <div className="space-y-2">
              <div className={getClassName("flex justify-between", "rtl:flex-row-reverse")}>
                <span>{isRTL ? "تاريخ قصير:" : "Short Date:"}</span>
                <RTLDate date={new Date()} format="short" />
              </div>
              <div className={getClassName("flex justify-between", "rtl:flex-row-reverse")}>
                <span>{isRTL ? "تاريخ متوسط:" : "Medium Date:"}</span>
                <RTLDate date={new Date()} format="medium" />
              </div>
              <div className={getClassName("flex justify-between", "rtl:flex-row-reverse")}>
                <span>{isRTL ? "تاريخ طويل:" : "Long Date:"}</span>
                <RTLDate date={new Date()} format="long" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interview-like Component Demo */}
      <div className={getClassName("bg-white p-6 rounded-lg border", "interview-complete")}>
        <h2 className="text-xl font-semibold mb-6" style={{ textAlign: textAlign() as any }}>
          {isRTL ? "عرض توضيحي لمكونات المقابلة" : "Interview Components Demo"}
        </h2>
        
        <div className="space-y-4 interview-radio-group">
          <div className="font-medium interview-question" style={{ textAlign: textAlign() as any }}>
            {isRTL ? "ما هو وضعك الحالي في الولايات المتحدة؟" : "What is your current status in the United States?"}
          </div>
          
          {[
            { value: 'citizen', labelEn: 'U.S. Citizen', labelAr: 'مواطن أمريكي' },
            { value: 'resident', labelEn: 'Permanent Resident', labelAr: 'مقيم دائم' },
            { value: 'visa', labelEn: 'Visa Holder', labelAr: 'حامل تأشيرة' },
            { value: 'other', labelEn: 'Other', labelAr: 'أخرى' }
          ].map((option) => (
            <label 
              key={option.value}
              className={getClassName(
                "flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer",
                "interview-radio-option rtl:space-x-reverse rtl:flex-row-reverse"
              )}
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                className={getClassName("w-4 h-4 text-blue-600", "rtl:ml-3 rtl:mr-0")}
              />
              <div style={{ textAlign: textAlign() as any }}>
                <div className="font-medium">
                  {isRTL ? option.labelAr : option.labelEn}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-4 mt-6 interview-actions rtl:space-x-reverse rtl:justify-start">
          <Button variant="outline">
            {isRTL ? "السابق" : "Previous"}
          </Button>
          <Button variant="primary">
            {isRTL ? "التالي" : "Next"}
          </Button>
        </div>
      </div>

      {/* Visa Chips Demo */}
      <div className="bg-gray-50 p-6 rounded-lg interview-progress-stats">
        <h2 className="text-xl font-semibold mb-4" style={{ textAlign: textAlign() as any }}>
          {isRTL ? "عرض توضيحي لرقائق التأشيرة" : "Visa Chips Demo"}
        </h2>
        
        <div className="text-sm text-gray-600 mb-4 interview-progress-text" style={{ textAlign: textAlign() as any }}>
          {isRTL ? "أنواع التأشيرات المتبقية: " : "Remaining visa types: "}
          <RTLNumber value={12} />
        </div>
        
        <div className="flex flex-wrap gap-2 interview-visa-chips">
          {['H1B', 'L1A', 'L1B', 'O1', 'EB1', 'EB2', 'EB3', 'F1', 'J1', 'B1/B2'].map((visa) => (
            <button
              key={visa}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-colors interview-visa-chip"
            >
              {visa}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}