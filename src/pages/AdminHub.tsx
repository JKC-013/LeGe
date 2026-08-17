import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, Song } from '../store';
import { Users, FileCheck, Database, Search, Check, X, Trash2, Edit, BarChart3, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EditSongModal } from '../components/EditSongModal';

export function AdminHub() {
  const { t } = useTranslation();
  const { users, songs, updateUserRole, approveSong, declineSong, deleteSong, editSong } = useStore();
  const [activeTab, setActiveTab] = useState<'access' | 'publisher' | 'score' | 'report'>('access');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  const safeQuery = (searchQuery || '').trim().toLowerCase();
  const filteredUsers = users.filter(u => {
    const emailMatch = u.email ? u.email.toLowerCase().includes(safeQuery) : false;
    const nameMatch = u.name ? u.name.toLowerCase().includes(safeQuery) : false;
    return emailMatch || nameMatch;
  });
  const pendingSongs = songs.filter(s => s.status === 'pending');
  const approvedSongs = songs.filter(s => s.status === 'approved');

  const handleSaveEdit = async (updates: Partial<Song>) => {
    if (editingSong) {
      await editSong(editingSong.id, updates);
    }
  };

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
          <span className="hidden sm:inline">{t('admin.roleAdmin')}</span>
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
          <span className="hidden sm:inline">{t('admin.approvePostings')}</span>
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
          <span className="hidden sm:inline">{t('admin.manageSongs')}</span>
        </button>
        <button
          className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'report'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/30'
          }`}
          onClick={() => setActiveTab('report')}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('admin.reports')}</span>
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
                placeholder={t('admin.searchQuery')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-outline-variant/15">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-surface text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('admin.user')}</th>
                    <th className="px-6 py-3 bg-surface text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('admin.role')}</th>
                    <th className="px-6 py-3 bg-surface text-right text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-surface-container-lowest divide-y divide-outline-variant/15">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface">
                        <div className="font-bold">{user.name || t('admin.unknown')}</div>
                        <div className="text-on-surface-variant">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant capitalize">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {user.role === 'user' && (
                          <>
                            <button onClick={() => updateUserRole(user.email, 'pastor')} className="text-primary hover:text-primary-container">{t('admin.upgradePastor')}</button>
                            <span className="text-outline-variant">|</span>
                            <button onClick={() => updateUserRole(user.email, 'collaborator')} className="text-primary hover:text-primary-container">{t('admin.upgradeCollaborator')}</button>
                          </>
                        )}
                        {user.role !== 'admin' && (
                          <>
                            <span className="text-outline-variant">|</span>
                            <button onClick={() => updateUserRole(user.email, 'admin')} className="text-primary hover:text-primary-container">{t('admin.upgradeAdmin')}</button>
                          </>
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
                      <p className="text-sm text-on-surface-variant">{song.organization} &bull; {song.category}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => setEditingSong(song)} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors" title={t('admin.edit')}>
                        <Edit className="w-5 h-5" />
                      </button>
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
                    <p className="text-sm text-on-surface-variant">{song.organization} &bull; {song.category}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setEditingSong(song)} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors" title={t('admin.edit')}>
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

        {activeTab === 'report' && (
          <div className="p-6 text-center space-y-6">
             <div className="bg-surface p-8 rounded-2xl border border-outline-variant/15">
               <h3 className="text-xl font-bold text-on-surface mb-4">{t('admin.annualReport')}</h3>
               <p className="text-on-surface-variant mb-6">{t('admin.reportDesc')}</p>
               
               <div className="flex justify-center items-center h-48 border border-outline-variant/10 rounded-xl mb-6 bg-surface-container-lowest">
                 {/* Mock Chart Area */}
                 <BarChart3 className="w-12 h-12 text-outline-variant opacity-20" />
               </div>

               <div className="flex justify-center space-x-4">
                 <button className="px-6 py-2 bg-primary text-on-primary rounded-full font-bold flex items-center shadow-ambient hover:bg-primary-container transition-colors">
                   <Download className="w-4 h-4 mr-2" /> {t('admin.downloadPdf')}
                 </button>
                 <button className="px-6 py-2 bg-error/10 text-error rounded-full font-bold flex items-center hover:bg-error/20 transition-colors">
                   <Trash2 className="w-4 h-4 mr-2" /> {t('admin.deleteReport')}
                 </button>
               </div>
             </div>
          </div>
        )}
      </div>

      <EditSongModal 
        song={editingSong} 
        isOpen={!!editingSong} 
        onClose={() => setEditingSong(null)} 
        onSave={handleSaveEdit} 
      />
    </div>
  );
}
