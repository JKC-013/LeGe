import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { Trash2, Bell, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Notifications() {
  const { t } = useTranslation();
  const { currentUser, notifications, deleteNotification } = useStore();

  if (!currentUser) return null;


  const myNotifications = notifications.filter(n => n.user_id === currentUser.id);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link to="/songs" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('song.back') || 'Back'}
      </Link>
      <h1 className="text-3xl font-display font-bold text-on-surface">{t('notifications.title')}</h1>
      
      {myNotifications.length === 0 ? (
        <div className="bg-surface-container-lowest p-12 text-center rounded-2xl shadow-ambient border border-outline-variant/10">
          <Bell className="w-12 h-12 text-outline-variant opacity-20 mx-auto mb-4" />
          <p className="text-on-surface-variant font-medium">{t('notifications.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myNotifications.map(notification => (
            <div key={notification.id} className="bg-surface-container-lowest p-5 rounded-2xl shadow-ambient flex justify-between items-start border border-outline-variant/10">
              <div>
                <p className={`text-sm ${notification.read ? 'text-on-surface-variant' : 'text-on-surface font-bold'}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-on-surface-variant mt-2">
                  {new Date(notification.created_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => deleteNotification(notification.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
