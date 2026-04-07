import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { Users, FileCheck, Database, Search, Check, X, Trash2, Edit } from 'lucide-react';

export function AdminHub() {
  const { t } = useTranslation();
  const { users, songs, updateUserRole, approveSong, declineSong, deleteSong } = useStore();
  const [activeTab, setActiveTab] = useState<'access' | 'publisher' | 'score'>('access');
  const [searchEmail, setSearchEmail] = useState('');

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchEmail.toLowerCase()));
  const pendingSongs = songs.filter(s => s.status === 'pending');
  const approvedSongs = songs.filter(s => s.status === 'approved');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold text-on-surface">{t('admin.title')}</h1>
      </div>

      <div className="flex flex-wrap justify-center border-b border-outline-variant/15 gap-2">
        <button
          className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'access'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/30'
          }`}
          onClick={() => setActiveTab('access')}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">{t('admin.manageAccess')}</span>
        </button>
        <button
          className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'publisher'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/30'
          }`}
          onClick={() => setActiveTab('publisher')}
        >
          <FileCheck className="w-4 h-4" />
          <span className="hidden sm:inline">{t('admin.managePublisher')}</span>
          {pendingSongs.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pendingSongs.length}</span>
          )}
        </button>
        <button
          className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'score'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/30'
          }`}
          onClick={() => setActiveTab('score')}
        >
          <Database className="w-4 h-4" />
          <span className="hidden sm:inline">{t('admin.manageScore')}</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
        {activeTab === 'access' && (
          <div className="p-6">
            <div className="max-w-md mb-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-outline-variant" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-lg rounded-b-sm leading-5 text-on-surface placeholder-on-surface-variant/70 focus:outline-none sm:text-sm transition-colors"
                placeholder={t('admin.searchEmail')}
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-outline-variant/15">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-surface text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('admin.email')}</th>
                    <th className="px-6 py-3 bg-surface text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('admin.role')}</th>
                    <th className="px-6 py-3 bg-surface text-right text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-surface-container-lowest divide-y divide-outline-variant/15">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant capitalize">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {user.role !== 'publisher' && user.role !== 'admin' && (
                          <button onClick={() => updateUserRole(user.email, 'publisher')} className="text-primary hover:text-primary-container">{t('admin.upgradePublisher')}</button>
                        )}
                        {user.role !== 'admin' && (
                          <button onClick={() => updateUserRole(user.email, 'admin')} className="text-primary hover:text-primary-container">{t('admin.upgradeAdmin')}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'publisher' && (
          <div className="p-6">
            {pendingSongs.length === 0 ? (
              <div className="text-center py-12 text-outline-variant text-lg">{t('admin.noPending')}</div>
            ) : (
              <div className="space-y-4">
                {pendingSongs.map(song => (
                  <div key={song.id} className="flex items-center justify-between p-4 border border-outline-variant/15 rounded-xl bg-surface">
                    <div>
                      <h4 className="text-lg font-bold text-on-surface">{song.title}</h4>
                      <p className="text-sm text-on-surface-variant">{song.author} &bull; {song.category} &bull; {song.audience}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => approveSong(song.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors shadow-sm" title={t('admin.approve')}>
                        <Check className="w-5 h-5" />
                      </button>
                      <button onClick={() => declineSong(song.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors shadow-sm" title={t('admin.decline')}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'score' && (
          <div className="p-6">
            <div className="space-y-4">
              {approvedSongs.map(song => (
                <div key={song.id} className="flex items-center justify-between p-4 border border-outline-variant/15 rounded-xl bg-surface">
                  <div>
                    <h4 className="text-lg font-bold text-on-surface">{song.title}</h4>
                    <p className="text-sm text-on-surface-variant">{song.author} &bull; {song.category}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors" title={t('admin.edit')}>
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteSong(song.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title={t('admin.delete')}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
