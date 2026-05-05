import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, Info } from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';

export function NotificationToast() {
  const { t } = useTranslation();
  const { notifications, markNotificationAsRead, deleteNotification, fetchNotifications } = useStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadNotifications = notifications.filter(n => !n.read);

  if (unreadNotifications.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'worship_approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'worship_rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {unreadNotifications.slice(0, 3).map(notification => (
        <div
          key={notification.id}
          className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4 shadow-ambient animate-in slide-in-from-right-2"
        >
          <div className="flex items-start gap-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-on-surface text-sm">{notification.title}</h4>
              <p className="text-on-surface-variant text-sm mt-1">{notification.message}</p>
              <p className="text-on-surface-variant text-xs mt-2">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => deleteNotification(notification.id)}
              className="p-1 hover:bg-surface-container rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>
          <div className="flex justify-end mt-3 gap-2">
            <button
              onClick={() => markNotificationAsRead(notification.id)}
              className="px-3 py-1 text-xs bg-primary text-on-primary rounded hover:bg-primary/90 transition-colors"
            >
              {t('notifications.markAsRead')}
            </button>
          </div>
        </div>
      ))}
      {unreadNotifications.length > 3 && (
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-3 shadow-ambient text-center">
          <p className="text-on-surface-variant text-sm">
            +{unreadNotifications.length - 3} more notifications
          </p>
        </div>
      )}
    </div>
  );
}