import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, Info, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';

export function NotificationToast() {
  const { t } = useTranslation();
  const { currentUser, notifications, markNotificationAsRead, deleteNotification, clearAllNotifications, fetchNotifications, songs } = useStore();

  useEffect(() => {
    if (!currentUser) return;
    fetchNotifications();
  }, [currentUser, fetchNotifications]);

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

  const getStatusBadge = (type: string) => {
    switch (type) {
      case 'worship_approved':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Approved</span>;
      case 'worship_rejected':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Rejected</span>;
      default:
        return null;
    }
  };

  const getSongTitles = (notification: any) => {
    if (notification.data?.songIds) {
      return notification.data.songIds
        .map((id: string) => songs.find(s => s.id === id)?.title)
        .filter(Boolean)
        .join(', ');
    }
    return '';
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Clear All Button */}
      {unreadNotifications.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={clearAllNotifications}
            className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </button>
        </div>
      )}

      {unreadNotifications.slice(0, 5).map(notification => (
        <div
          key={notification.id}
          className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4 shadow-ambient animate-in slide-in-from-right-2"
        >
          <div className="flex items-start gap-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-on-surface text-sm">{notification.title}</h4>
                {getStatusBadge(notification.type)}
              </div>

              {/* Submission Details */}
              {notification.data?.songIds && (
                <div className="mb-2 p-2 bg-surface-container rounded text-xs">
                  <p className="text-on-surface-variant font-medium mb-1">Songs:</p>
                  <p className="text-on-surface">{getSongTitles(notification)}</p>
                </div>
              )}

              <p className="text-on-surface-variant text-sm mb-2">{notification.message}</p>

              <div className="flex items-center justify-between">
                <p className="text-on-surface-variant text-xs">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
                <button
                  onClick={() => markNotificationAsRead(notification.id)}
                  className="px-2 py-1 text-xs bg-primary text-on-primary rounded hover:bg-primary/90 transition-colors"
                >
                  {t('notifications.markAsRead')}
                </button>
              </div>
            </div>
            <button
              onClick={() => deleteNotification(notification.id)}
              className="p-1 hover:bg-surface-container rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>
        </div>
      ))}
      {unreadNotifications.length > 5 && (
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-3 shadow-ambient text-center">
          <p className="text-on-surface-variant text-sm">
            +{unreadNotifications.length - 5} more notifications
          </p>
        </div>
      )}
    </div>
  );
}