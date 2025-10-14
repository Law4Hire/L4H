import React from 'react';
import { useNotificationPreferences, NotificationType, NotificationPriority } from '../../hooks/useNotifications';

const NotificationPreferences: React.FC = () => {
  const { preferences, loading, error, updatePreference } = useNotificationPreferences();

  const getNotificationTypeLabel = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.ClientAssignment:
        return 'Client Assignment';
      case NotificationType.CaseStatusChange:
        return 'Case Status Changes';
      case NotificationType.BillingThreshold:
        return 'Billing Threshold Warnings';
      case NotificationType.DeadlineReminder:
        return 'Deadline Reminders';
      case NotificationType.DocumentUpload:
        return 'Document Uploads';
      case NotificationType.TimeEntryReminder:
        return 'Time Entry Reminders';
      case NotificationType.SystemAlert:
        return 'System Alerts';
      default:
        return 'Unknown';
    }
  };

  const getNotificationTypeDescription = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.ClientAssignment:
        return 'Notifications when you are assigned new clients';
      case NotificationType.CaseStatusChange:
        return 'Notifications when case statuses are updated';
      case NotificationType.BillingThreshold:
        return 'Warnings when billing amounts approach thresholds';
      case NotificationType.DeadlineReminder:
        return 'Reminders for upcoming deadlines and tasks';
      case NotificationType.DocumentUpload:
        return 'Notifications when clients upload new documents';
      case NotificationType.TimeEntryReminder:
        return 'Reminders to record billable time';
      case NotificationType.SystemAlert:
        return 'Important system notifications and alerts';
      default:
        return '';
    }
  };

  const getPriorityLabel = (priority: NotificationPriority): string => {
    switch (priority) {
      case NotificationPriority.Low:
        return 'Low';
      case NotificationPriority.Normal:
        return 'Normal';
      case NotificationPriority.High:
        return 'High';
      case NotificationPriority.Critical:
        return 'Critical';
      default:
        return 'Normal';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading preferences</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="mt-2 text-gray-600">
          Manage how and when you receive notifications from the system.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {preferences.map((preference) => (
            <div key={preference.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-medium text-gray-900">
                    {getNotificationTypeLabel(preference.notificationType)}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {getNotificationTypeDescription(preference.notificationType)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* In-App Notifications */}
                <div className="flex items-center">
                  <input
                    id={`in-app-${preference.id}`}
                    type="checkbox"
                    checked={preference.inAppEnabled}
                    onChange={(e) =>
                      updatePreference(
                        preference.notificationType,
                        e.target.checked,
                        preference.emailEnabled,
                        preference.minimumPriority
                      )
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`in-app-${preference.id}`} className="ml-2 text-sm text-gray-700">
                    In-app notifications
                  </label>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center">
                  <input
                    id={`email-${preference.id}`}
                    type="checkbox"
                    checked={preference.emailEnabled}
                    onChange={(e) =>
                      updatePreference(
                        preference.notificationType,
                        preference.inAppEnabled,
                        e.target.checked,
                        preference.minimumPriority
                      )
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`email-${preference.id}`} className="ml-2 text-sm text-gray-700">
                    Email notifications
                  </label>
                </div>

                {/* Minimum Priority */}
                <div>
                  <label htmlFor={`priority-${preference.id}`} className="block text-sm text-gray-700 mb-1">
                    Minimum priority
                  </label>
                  <select
                    id={`priority-${preference.id}`}
                    value={preference.minimumPriority}
                    onChange={(e) =>
                      updatePreference(
                        preference.notificationType,
                        preference.inAppEnabled,
                        preference.emailEnabled,
                        parseInt(e.target.value) as NotificationPriority
                      )
                    }
                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={NotificationPriority.Low}>Low</option>
                    <option value={NotificationPriority.Normal}>Normal</option>
                    <option value={NotificationPriority.High}>High</option>
                    <option value={NotificationPriority.Critical}>Critical</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About notification priorities</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Critical:</strong> Urgent notifications requiring immediate attention</li>
                <li><strong>High:</strong> Important notifications that should be addressed soon</li>
                <li><strong>Normal:</strong> Standard notifications for regular updates</li>
                <li><strong>Low:</strong> Informational notifications that can be reviewed later</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;