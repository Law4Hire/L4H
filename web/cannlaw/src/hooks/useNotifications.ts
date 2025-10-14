import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  isEmailSent: boolean;
  emailSentAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

export enum NotificationType {
  ClientAssignment = 0,
  CaseStatusChange = 1,
  BillingThreshold = 2,
  DeadlineReminder = 3,
  SystemAlert = 4,
  DocumentUpload = 5,
  TimeEntryReminder = 6
}

export enum NotificationPriority {
  Low = 0,
  Normal = 1,
  High = 2,
  Critical = 3
}

export interface UserNotificationPreference {
  id: number;
  userId: number;
  notificationType: NotificationType;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  minimumPriority: NotificationPriority;
  createdAt: string;
  updatedAt: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  const fetchNotifications = useCallback(async (unreadOnly = false, skip = 0, take = 50) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        unreadOnly: unreadOnly.toString(),
        skip: skip.toString(),
        take: take.toString(),
      });

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const count = await response.json();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: number) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: number) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, [notifications]);

  const createNotification = useCallback(async (
    title: string,
    message: string,
    type: NotificationType,
    priority: NotificationPriority = NotificationPriority.Normal,
    relatedEntityType?: string,
    relatedEntityId?: number,
    actionUrl?: string
  ) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          message,
          type,
          priority,
          relatedEntityType,
          relatedEntityId,
          actionUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newNotification = await response.json();
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      return newNotification;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create notification');
      throw err;
    }
  }, []);

  const enableRealTime = useCallback(() => {
    if (!user || realTimeEnabled) return;

    // In a real implementation, this would set up WebSocket or Server-Sent Events
    // For now, we'll use more frequent polling
    setRealTimeEnabled(true);
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications(false, 0, 10); // Fetch latest 10 notifications
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(interval);
      setRealTimeEnabled(false);
    };
  }, [user, realTimeEnabled, fetchUnreadCount, fetchNotifications]);

  const disableRealTime = useCallback(() => {
    setRealTimeEnabled(false);
  }, []);

  // Auto-refresh unread count every 30 seconds (or 5 seconds if real-time enabled)
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, realTimeEnabled ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, realTimeEnabled]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    realTimeEnabled,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    enableRealTime,
    disableRealTime,
    refresh: fetchNotifications,
  };
};

export const useNotificationPreferences = () => {
  const { } = useAuth();
  const [preferences, setPreferences] = useState<UserNotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreference = useCallback(async (
    type: NotificationType,
    inAppEnabled: boolean,
    emailEnabled: boolean,
    minimumPriority: NotificationPriority
  ) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          inAppEnabled,
          emailEnabled,
          minimumPriority,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setPreferences(prev =>
        prev.map(p =>
          p.notificationType === type
            ? { ...p, inAppEnabled, emailEnabled, minimumPriority, updatedAt: new Date().toISOString() }
            : p
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference');
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    refresh: fetchPreferences,
  };
};

export const useEmailNotifications = () => {
  const { user } = useAuth();
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    frequency: 'immediate' as 'immediate' | 'daily' | 'weekly',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    categories: [] as NotificationType[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmailSettings = useCallback(async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/email-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const settings = await response.json();
      setEmailSettings(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch email settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEmailSettings = useCallback(async (settings: Partial<typeof emailSettings>) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/email-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedSettings = await response.json();
      setEmailSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const testEmailNotification = useCallback(async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test email');
      throw err;
    }
  }, []);

  const getEmailHistory = useCallback(async (days = 30) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return [];

    try {
      const response = await fetch(`/api/notifications/email-history?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch email history');
      return [];
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchEmailSettings();
    }
  }, [user, fetchEmailSettings]);

  return {
    emailSettings,
    loading,
    error,
    updateEmailSettings,
    testEmailNotification,
    getEmailHistory,
    refresh: fetchEmailSettings,
  };
};

export interface SystemAlert {
  id: number;
  type: 'billing_threshold' | 'deadline_reminder' | 'system_maintenance' | 'security_alert';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  isActive: boolean;
  triggerCondition?: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
  createdAt: string;
  updatedAt: string;
  dismissedAt?: string;
  actionRequired: boolean;
  actionUrl?: string;
}

export const useSystemAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemAlerts = useCallback(async (activeOnly = false) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        activeOnly: activeOnly.toString(),
      });

      const response = await fetch(`/api/notifications/system-alerts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (activeOnly) {
        setActiveAlerts(data);
      } else {
        setAlerts(data);
        setActiveAlerts(data.filter((alert: SystemAlert) => alert.isActive));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissAlert = useCallback(async (alertId: number) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/notifications/system-alerts/${alertId}/dismiss`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      const now = new Date().toISOString();
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, isActive: false, dismissedAt: now }
            : alert
        )
      );
      setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss alert');
      throw err;
    }
  }, []);

  const createBillingAlert = useCallback(async (
    clientId: number,
    attorneyId: number,
    threshold: number,
    currentAmount: number
  ) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch('/api/notifications/system-alerts/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId,
          attorneyId,
          threshold,
          currentAmount,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newAlert = await response.json();
      setAlerts(prev => [newAlert, ...prev]);
      setActiveAlerts(prev => [newAlert, ...prev]);
      
      return newAlert;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create billing alert');
      throw err;
    }
  }, []);

  const createDeadlineAlert = useCallback(async (
    caseId: number,
    deadline: string,
    description: string,
    daysBeforeWarning = 7
  ) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch('/api/notifications/system-alerts/deadline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          caseId,
          deadline,
          description,
          daysBeforeWarning,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newAlert = await response.json();
      setAlerts(prev => [newAlert, ...prev]);
      setActiveAlerts(prev => [newAlert, ...prev]);
      
      return newAlert;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deadline alert');
      throw err;
    }
  }, []);

  const getAlertsByType = useCallback((type: SystemAlert['type']) => {
    return alerts.filter(alert => alert.type === type);
  }, [alerts]);

  const getAlertsBySeverity = useCallback((severity: SystemAlert['severity']) => {
    return alerts.filter(alert => alert.severity === severity);
  }, [alerts]);

  // Auto-refresh active alerts every minute
  useEffect(() => {
    if (!user) return;

    fetchSystemAlerts(true);
    const interval = setInterval(() => fetchSystemAlerts(true), 60000);
    return () => clearInterval(interval);
  }, [user, fetchSystemAlerts]);

  return {
    alerts,
    activeAlerts,
    loading,
    error,
    fetchSystemAlerts,
    dismissAlert,
    createBillingAlert,
    createDeadlineAlert,
    getAlertsByType,
    getAlertsBySeverity,
    refresh: () => fetchSystemAlerts(false),
  };
};

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: 'client' | 'attorney' | 'admin';
  recipientId: number;
  recipientName: string;
  recipientRole: 'client' | 'attorney' | 'admin';
  subject?: string;
  content: string;
  messageType: 'text' | 'file' | 'system';
  attachments?: MessageAttachment[];
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  relatedCaseId?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface MessageAttachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
}

export interface Conversation {
  id: number;
  clientId: number;
  attorneyId: number;
  clientName: string;
  attorneyName: string;
  subject: string;
  lastMessageAt: string;
  lastMessageContent: string;
  unreadCount: number;
  isActive: boolean;
  relatedCaseId?: number;
  createdAt: string;
}

export const useCommunication = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

  const fetchConversations = useCallback(async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/communications/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setConversations(data);
      
      // Calculate total unread messages
      const totalUnread = data.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
      setTotalUnreadMessages(totalUnread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: number, skip = 0, take = 50) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        take: take.toString(),
      });

      const response = await fetch(`/api/communications/conversations/${conversationId}/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (skip === 0) {
        setMessages(data);
      } else {
        setMessages(prev => [...prev, ...data]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (
    conversationId: number,
    content: string,
    attachments?: File[],
    priority: Message['priority'] = 'normal'
  ) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    const formData = new FormData();
    formData.append('conversationId', conversationId.toString());
    formData.append('content', content);
    formData.append('priority', priority);

    if (attachments) {
      attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    try {
      const response = await fetch('/api/communications/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newMessage = await response.json();
      setMessages(prev => [newMessage, ...prev]);
      
      // Update conversation last message
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                lastMessageAt: newMessage.sentAt,
                lastMessageContent: content,
              }
            : conv
        )
      );

      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, []);

  const createConversation = useCallback(async (
    clientId: number,
    attorneyId: number,
    subject: string,
    initialMessage: string,
    relatedCaseId?: number
  ) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch('/api/communications/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId,
          attorneyId,
          subject,
          initialMessage,
          relatedCaseId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newConversation = await response.json();
      setConversations(prev => [newConversation, ...prev]);
      
      return newConversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      throw err;
    }
  }, []);

  const markMessagesAsRead = useCallback(async (conversationId: number) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/communications/conversations/${conversationId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.conversationId === conversationId && !msg.isRead
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        )
      );

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );

      // Update total unread count
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setTotalUnreadMessages(prev => Math.max(0, prev - conversation.unreadCount));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark messages as read');
    }
  }, [conversations]);

  const searchMessages = useCallback(async (query: string, conversationId?: number) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return [];

    try {
      const params = new URLSearchParams({
        query,
        ...(conversationId && { conversationId: conversationId.toString() }),
      });

      const response = await fetch(`/api/communications/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search messages');
      return [];
    }
  }, []);

  const archiveConversation = useCallback(async (conversationId: number) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/communications/conversations/${conversationId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, isActive: false }
            : conv
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive conversation');
      throw err;
    }
  }, []);

  // Auto-refresh conversations every 30 seconds
  useEffect(() => {
    if (!user) return;

    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    currentConversation,
    totalUnreadMessages,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    markMessagesAsRead,
    searchMessages,
    archiveConversation,
    setCurrentConversation,
    refresh: fetchConversations,
  };
};