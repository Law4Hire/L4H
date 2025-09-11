import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// RTL languages that should flip layout
const RTL_LANGUAGES = ['ar-SA', 'ur-PK', 'ar', 'ur'];
// Minimal seed resources
const resources = {
    en: {
        translation: {
            // Navigation
            'nav.login': 'Login',
            'nav.dashboard': 'Dashboard',
            'nav.schedule': 'Schedule',
            'nav.cases': 'Cases',
            'nav.admin': 'Admin',
            'nav.logout': 'Logout',
            // Auth
            'auth.email': 'Email',
            'auth.password': 'Password',
            'auth.remember': 'Remember me',
            'auth.login': 'Login',
            'auth.logout': 'Logout',
            // Status
            'status.pending': 'Pending',
            'status.paid': 'Paid',
            'status.active': 'Active',
            'status.inactive': 'Inactive',
            'status.closed': 'Closed',
            'status.denied': 'Denied',
            // Common
            'common.loading': 'Loading...',
            'common.error': 'Error',
            'common.success': 'Success',
            'common.cancel': 'Cancel',
            'common.save': 'Save',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.view': 'View',
            // Language
            'language.select': 'Select Language',
            'language.english': 'English',
            'language.spanish': 'Spanish',
            'language.arabic': 'Arabic',
        }
    },
    es: {
        translation: {
            // Navigation
            'nav.login': 'Iniciar sesión',
            'nav.dashboard': 'Panel de control',
            'nav.schedule': 'Horario',
            'nav.cases': 'Casos',
            'nav.admin': 'Administración',
            'nav.logout': 'Cerrar sesión',
            // Auth
            'auth.email': 'Correo electrónico',
            'auth.password': 'Contraseña',
            'auth.remember': 'Recordarme',
            'auth.login': 'Iniciar sesión',
            'auth.logout': 'Cerrar sesión',
            // Status
            'status.pending': 'Pendiente',
            'status.paid': 'Pagado',
            'status.active': 'Activo',
            'status.inactive': 'Inactivo',
            'status.closed': 'Cerrado',
            'status.denied': 'Denegado',
            // Common
            'common.loading': 'Cargando...',
            'common.error': 'Error',
            'common.success': 'Éxito',
            'common.cancel': 'Cancelar',
            'common.save': 'Guardar',
            'common.delete': 'Eliminar',
            'common.edit': 'Editar',
            'common.view': 'Ver',
            // Language
            'language.select': 'Seleccionar idioma',
            'language.english': 'Inglés',
            'language.spanish': 'Español',
            'language.arabic': 'Árabe',
        }
    },
    'ar-SA': {
        translation: {
            // Navigation (Arabic skeleton)
            'nav.login': 'تسجيل الدخول',
            'nav.dashboard': 'لوحة التحكم',
            'nav.schedule': 'الجدولة',
            'nav.cases': 'الحالات',
            'nav.admin': 'الإدارة',
            'nav.logout': 'تسجيل الخروج',
            // Auth
            'auth.email': 'البريد الإلكتروني',
            'auth.password': 'كلمة المرور',
            'auth.remember': 'تذكرني',
            'auth.login': 'تسجيل الدخول',
            'auth.logout': 'تسجيل الخروج',
            // Status
            'status.pending': 'معلق',
            'status.paid': 'مدفوع',
            'status.active': 'نشط',
            'status.inactive': 'غير نشط',
            'status.closed': 'مغلق',
            'status.denied': 'مرفوض',
            // Common
            'common.loading': 'جاري التحميل...',
            'common.error': 'خطأ',
            'common.success': 'نجح',
            'common.cancel': 'إلغاء',
            'common.save': 'حفظ',
            'common.delete': 'حذف',
            'common.edit': 'تعديل',
            'common.view': 'عرض',
            // Language
            'language.select': 'اختر اللغة',
            'language.english': 'الإنجليزية',
            'language.spanish': 'الإسبانية',
            'language.arabic': 'العربية',
        }
    }
};
// Initialize i18next
i18n
    .use(initReactI18next)
    .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false
    }
});
export default i18n;
// Load supported cultures from API
export async function loadSupportedCultures() {
    try {
        const response = await fetch('/api/v1/i18n/supported');
        if (!response.ok) {
            throw new Error(`Failed to load cultures: ${response.status}`);
        }
        return await response.json();
    }
    catch (error) {
        console.warn('Failed to load supported cultures, using fallback:', error);
        return [
            { code: 'en', displayName: 'English' },
            { code: 'es', displayName: 'Spanish' }
        ];
    }
}
// Set culture via API
export async function setCulture(cultureCode) {
    try {
        const response = await fetch('/api/v1/i18n/culture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ culture: cultureCode })
        });
        if (!response.ok) {
            throw new Error(`Failed to set culture: ${response.status}`);
        }
        // Update i18n language
        await i18n.changeLanguage(cultureCode);
        // Set RTL direction
        setRTLDirection(cultureCode);
    }
    catch (error) {
        console.error('Failed to set culture:', error);
        // Still try to change language locally
        await i18n.changeLanguage(cultureCode);
        setRTLDirection(cultureCode);
    }
}
// Set RTL direction based on language
export function setRTLDirection(languageCode) {
    const htmlElement = document.documentElement;
    const isRTL = RTL_LANGUAGES.some(rtlLang => languageCode.toLowerCase().startsWith(rtlLang.toLowerCase()));
    htmlElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    htmlElement.setAttribute('lang', languageCode);
}
// Check if current language is RTL
export function isRTL() {
    const currentLang = i18n.language;
    return RTL_LANGUAGES.some(rtlLang => currentLang.toLowerCase().startsWith(rtlLang.toLowerCase()));
}
