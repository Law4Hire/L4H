import '@testing-library/jest-dom'

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock scrollTo
global.scrollTo = vi.fn()

// Mock react-i18next to avoid backend loading issues in tests
vi.mock('react-i18next', () => ({
  // this mock makes sure any components using the translate hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t: (str: string) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
        language: 'en-US',
        dir: () => 'ltr',
        loadNamespaces: () => Promise.resolve(),
        on: () => {},
        off: () => {},
        exists: () => true,
        isInitialized: true,
        options: {}
      },
      ready: true,
    }
  },
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  }: ({ children }: { children: any }) => children,
  Translation: ({ children }: { children: (t: any, options: any) => any }) => children((k: any) => k, { i18n: {} }),
  I18nextProvider: ({ children }: { children: any }) => children,
}))
