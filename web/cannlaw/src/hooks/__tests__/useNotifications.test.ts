import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useNotifications, useEmailNotifications, useSystemAlerts, useCommunication } from '../useNotifications';

// Mock the useAuth hook to return null user to prevent API calls
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    user: null, // No user to prevent API calls on mount
  }),
}));

// Mock fetch to prevent actual API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null), // No token to prevent API calls
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Notification Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useNotifications', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.realTimeEnabled).toBe(false);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useNotifications());

      expect(typeof result.current.fetchNotifications).toBe('function');
      expect(typeof result.current.fetchUnreadCount).toBe('function');
      expect(typeof result.current.markAsRead).toBe('function');
      expect(typeof result.current.markAllAsRead).toBe('function');
      expect(typeof result.current.deleteNotification).toBe('function');
      expect(typeof result.current.createNotification).toBe('function');
      expect(typeof result.current.enableRealTime).toBe('function');
      expect(typeof result.current.disableRealTime).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('useEmailNotifications', () => {
    it('should initialize with default email settings', () => {
      const { result } = renderHook(() => useEmailNotifications());

      expect(result.current.emailSettings.enabled).toBe(true);
      expect(result.current.emailSettings.frequency).toBe('immediate');
      expect(result.current.emailSettings.quietHours.enabled).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useEmailNotifications());

      expect(typeof result.current.updateEmailSettings).toBe('function');
      expect(typeof result.current.testEmailNotification).toBe('function');
      expect(typeof result.current.getEmailHistory).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('useSystemAlerts', () => {
    it('should initialize with empty alerts', () => {
      const { result } = renderHook(() => useSystemAlerts());

      expect(result.current.alerts).toEqual([]);
      expect(result.current.activeAlerts).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useSystemAlerts());

      expect(typeof result.current.fetchSystemAlerts).toBe('function');
      expect(typeof result.current.dismissAlert).toBe('function');
      expect(typeof result.current.createBillingAlert).toBe('function');
      expect(typeof result.current.createDeadlineAlert).toBe('function');
      expect(typeof result.current.getAlertsByType).toBe('function');
      expect(typeof result.current.getAlertsBySeverity).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('useCommunication', () => {
    it('should initialize with empty conversations and messages', () => {
      const { result } = renderHook(() => useCommunication());

      expect(result.current.conversations).toEqual([]);
      expect(result.current.messages).toEqual([]);
      expect(result.current.currentConversation).toBe(null);
      expect(result.current.totalUnreadMessages).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useCommunication());

      expect(typeof result.current.fetchConversations).toBe('function');
      expect(typeof result.current.fetchMessages).toBe('function');
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.createConversation).toBe('function');
      expect(typeof result.current.markMessagesAsRead).toBe('function');
      expect(typeof result.current.searchMessages).toBe('function');
      expect(typeof result.current.archiveConversation).toBe('function');
      expect(typeof result.current.setCurrentConversation).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });
  });
});