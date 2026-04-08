import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { Users, FileCheck, Database, Search, Check, X, Trash2, Edit, Upload, Loader2, KeyRound, FileText, CheckCircle2, Eye, ExternalLink, Heart } from 'lucide-react';
import { generatePdfThumbnail } from '../lib/pdfUtils';
import { supabase } from '../lib/supabase';

export function AdminHub() {
  const { t } = useTranslation();
  const { users, songs, updateUserRole, approveSong, declineSong, deleteSong, updateSong, worshipSubmissions, fetchWorshipSubmissions, approveWorshipSubmission, declineWorshipSubmission } = useStore();
  const [activeTab, setActiveTab] = useState<'access' | 'publisher' | 'score' | 'worship'>('access');
  const [searchEmail, setSearchEmail] = useState('');
  const [scoreSearch, setScoreSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [previewSongId, setPreviewSongId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'worship') {
      fetchWorshipSubmissions();
    }
  }, [activeTab, fetchWorshipSubmissions]);

  // Derive editingSong reactively — key deletions/replacements auto-reflect without manual refresh
  const editingSong = editingSongId ? songs.find(s => s.id === editingSongId) ?? null : null;

  // Local mutable copy for the editable text fields in the form
  const [formValues, setFormValues] = useState({ title: '', author: '', category: '', audience: 'band', lyrics: '' });
  useEffect(() => {
    if (editingSong) {
      setFormValues({
        title: editingSong.title,
        author: editingSong.author,
        category: editingSong.category,
        audience: editingSong.audience,
        lyrics: editingSong.lyrics || ''
      });
    }
  }, [editingSongId]);

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchEmail.toLowerCase()));
  const pendingSongs = songs.filter(s => s.status === 'pending');
  const approvedSongs = songs.filter(s => 
    s.status === 'approved' && 
    (s.title.toLowerCase().includes(scoreSearch.toLowerCase()) || 
     s.author.toLowerCase().includes(scoreSearch.toLowerCase()))
  );

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
        <button
          className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'worship'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/30'
          }`}
          onClick={() => setActiveTab('worship')}
        >
          <Heart className="w-4 h-4" />
          <span className="hidden sm:inline">{t('admin.sundayWorship')}</span>
          {worshipSubmissions.filter(s => s.status === 'pending').length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{worshipSubmissions.filter(s => s.status === 'pending').length}</span>
          )}
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
                  <div key={song.id} className="border border-outline-variant/15 rounded-xl bg-surface overflow-hidden">
                    {/* Header row */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-on-surface truncate">{song.title}</h4>
                        <p className="text-sm text-on-surface-variant">{song.author} &bull; {song.category} &bull; {song.audience}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button 
                          onClick={() => setPreviewSongId(previewSongId === song.id ? null : song.id)}
                          className={`p-2 rounded-full transition-colors flex items-center gap-1 text-xs font-bold px-3 ${
                            previewSongId === song.id 
                              ? 'bg-primary text-on-primary' 
                              : 'text-on-surface-variant hover:bg-surface-container'
                          }`}
                          title={t('admin.viewSheet')}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">{t('admin.viewSheet')}</span>
                        </button>
                        <button onClick={async () => { setProcessingId(song.id); await approveSong(song.id); setProcessingId(null); }} disabled={processingId === song.id} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" title={t('admin.approve')}>
                          {processingId === song.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        </button>
                        <button onClick={async () => { setProcessingId(song.id); await declineSong(song.id); setProcessingId(null); }} disabled={processingId === song.id} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" title={t('admin.decline')}>
                          {processingId === song.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable preview panel */}
                    {previewSongId === song.id && (
                      <div className="border-t border-outline-variant/15 p-4 bg-surface-container/30">
                        <div className="flex gap-4 items-start">
                          {/* Thumbnail */}
                          <div className="w-28 shrink-0 aspect-[3/4] bg-surface-container rounded-lg overflow-hidden shadow-sm">
                            {song.previewUrl ? (
                              <img src={song.previewUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-outline-variant" />
                              </div>
                            )}
                          </div>
                          {/* Details + actions */}
                          <div className="flex-1 space-y-3">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-on-surface">{song.title}</p>
                              <p className="text-xs text-on-surface-variant">{song.author}</p>
                              {song.lyrics && (
                                <p className="text-xs text-on-surface-variant mt-2 line-clamp-4 whitespace-pre-wrap leading-relaxed">{song.lyrics}</p>
                              )}
                            </div>
                            <a
                              href={song.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-full hover:bg-primary-container transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {t('admin.openPdf')}
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </a>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={async () => { setProcessingId(song.id); await approveSong(song.id); setProcessingId(null); setPreviewSongId(null); }}
                                disabled={processingId === song.id}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === song.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} {t('admin.approve')}
                              </button>
                              <button
                                onClick={async () => { setProcessingId(song.id); await declineSong(song.id); setProcessingId(null); setPreviewSongId(null); }}
                                disabled={processingId === song.id}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === song.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} {t('admin.decline')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'score' && (
          <div className="p-6">
            <div className="max-w-md mb-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-outline-variant" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-lg rounded-b-sm leading-5 text-on-surface placeholder-on-surface-variant/70 focus:outline-none sm:text-sm transition-colors"
                placeholder={t('admin.searchScore')}
                value={scoreSearch}
                onChange={(e) => setScoreSearch(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {approvedSongs.length === 0 ? (
                <div className="text-center py-12 text-outline-variant text-base">{t('admin.noApproved')}</div>
              ) : (
                approvedSongs.map(song => (
                  <div key={song.id} className="flex items-center justify-between p-4 border border-outline-variant/15 rounded-xl bg-surface">
                    <div>
                      <h4 className="text-lg font-bold text-on-surface">{song.title}</h4>
                      <p className="text-sm text-on-surface-variant">{song.author} &bull; {song.category} &bull; {song.keys?.length || 0} {t('admin.keysLabel')}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors" 
                        title={t('admin.edit')}
                        onClick={() => setEditingSongId(song.id)}
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={async () => {if(confirm(t('admin.deleteConfirm'))) { setProcessingId(song.id); await deleteSong(song.id); setProcessingId(null); }}} 
                        disabled={processingId === song.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                        title={t('admin.delete')}
                      >
                        {processingId === song.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'worship' && (
          <div className="p-6">
            {worshipSubmissions.length === 0 ? (
              <div className="text-center py-12 text-outline-variant text-lg">{t('admin.noWorshipSubmissions')}</div>
            ) : (
              <div className="space-y-4">
                {worshipSubmissions.map(submission => {
                  const submissionSongs = submission.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean);
                  const isPending = submission.status === 'pending';
                  
                  return (
                    <div key={submission.id} className={`border rounded-xl p-4 ${isPending ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/15 bg-surface'}`}>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-on-surface-variant">
                          {submission.status === 'pending' ? 'Pending' : submission.status === 'approved' ? 'Approved' : 'Declined'} • {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {submissionSongs.map(song => (
                          <button
                            key={song!.id}
                            onClick={() => window.open(`/song/${song!.id}`, '_blank')}
                            className="block w-full text-left p-3 bg-surface-container rounded hover:bg-surface-container-high transition-colors group"
                          >
                            <p className="font-medium text-on-surface group-hover:text-primary transition-colors">{song!.title}</p>
                            <p className="text-sm text-on-surface-variant">{song!.author} • {song!.category}</p>
                          </button>
                        ))}
                      </div>

                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => { setProcessingId(submission.id); await approveWorshipSubmission(submission.id); setProcessingId(null); }}
                            disabled={processingId === submission.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === submission.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {t('admin.approve')}
                          </button>
                          <button
                            onClick={async () => { setProcessingId(submission.id); await declineWorshipSubmission(submission.id); setProcessingId(null); }}
                            disabled={processingId === submission.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === submission.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            {t('admin.decline')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-container-lowest rounded-2xl shadow-ambient max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{t('admin.editSong')}</h3>
              <button onClick={() => setEditingSongId(null)} className="p-2 hover:bg-surface-container rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsUpdating(true);
              setUpdateStatus(t('admin.saving'));
              try {
                await updateSong(editingSong.id, {
                  title: formValues.title,
                  author: formValues.author,
                  category: formValues.category,
                  audience: formValues.audience as 'band' | 'worship',
                  lyrics: formValues.lyrics
                });
                setSaveSuccess(true);
                setTimeout(() => {
                  setSaveSuccess(false);
                  setEditingSongId(null);
                }, 1500);
              } catch(err: any) {
                alert(`${t('admin.saveFailed')}: ${err.message}`);
              } finally {
                setIsUpdating(false);
                setUpdateStatus('');
              }
            }} className="space-y-6">
              {saveSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-bold">{t('admin.saveSuccess')}</span>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1">{t('admin.fieldTitle')}</label>
                  <input required type="text" className="w-full bg-surface-container border-b focus:border-primary p-2" value={formValues.title} onChange={e => setFormValues({...formValues, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1">{t('admin.fieldAuthor')}</label>
                  <input required type="text" className="w-full bg-surface-container border-b focus:border-primary p-2" value={formValues.author} onChange={e => setFormValues({...formValues, author: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1">{t('admin.fieldCategory')}</label>
                  <input required type="text" className="w-full bg-surface-container border-b focus:border-primary p-2" value={formValues.category} onChange={e => setFormValues({...formValues, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1">{t('admin.fieldAudience')}</label>
                  <select className="w-full bg-surface-container border-b focus:border-primary p-2" value={formValues.audience} onChange={e => setFormValues({...formValues, audience: e.target.value})}>
                    <option value="band">Band</option>
                    <option value="worship">Worship</option>
                  </select>
                </div>
                {formValues.audience === 'worship' && (
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-1">{t('publisher.lyrics')}</label>
                    <textarea rows={4} className="w-full bg-surface-container border-b focus:border-primary p-2 text-sm" value={formValues.lyrics} onChange={e => setFormValues({...formValues, lyrics: e.target.value})} />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-outline-variant/15 space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant flex items-center">
                  <FileText className="w-4 h-4 mr-2" /> {t('admin.mainPdf')}
                </h4>
                <div className="flex items-center gap-4">
                  <a href={editingSong.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline truncate max-w-[150px]">{t('admin.currentPdf')}</a>
                  <label className="cursor-pointer bg-surface-container-high px-3 py-1.5 rounded-full text-xs font-bold hover:bg-surface-container-highest transition-colors flex items-center">
                    <Upload className="w-3 h-3 mr-2" /> {t('admin.replace')}
                    <input type="file" accept=".pdf" className="sr-only" onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        setIsUpdating(true);
                        setUpdateStatus('Processing new PDF...');
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `main_${Math.random().toString(36).substring(2)}.${fileExt}`;
                          const filePath = `pdfs/${fileName}`;
                          
                          setUpdateStatus('Uploading PDF...');
                          const { error: uploadError } = await supabase.storage.from('music-sheets').upload(filePath, file);
                          if (uploadError) throw uploadError;
                          
                          const { data: { publicUrl } } = supabase.storage.from('music-sheets').getPublicUrl(filePath);
                          
                          setUpdateStatus('Generating thumbnail...');
                          let newPreviewUrl = editingSong.previewUrl;
                          const thumbFile = await generatePdfThumbnail(file);
                          if (thumbFile) {
                            const thumbPath = `thumbnails/thumb_${Math.random().toString(36).substring(2)}.jpg`;
                            const { error: thumbErr } = await supabase.storage.from('music-sheets').upload(thumbPath, thumbFile);
                            if (!thumbErr) {
                              const { data: { publicUrl: tp } } = supabase.storage.from('music-sheets').getPublicUrl(thumbPath);
                              newPreviewUrl = tp;
                            }
                          }
                          
                          setUpdateStatus('Updating database...');
                          const { updateSong: storeUpdateSong } = useStore.getState();
                          await storeUpdateSong(editingSong.id, { pdfUrl: publicUrl, previewUrl: newPreviewUrl });
                          // No need to manually refresh — reactive editingSong auto-updates
                          alert("Main PDF replaced successfully");
                        } catch (err: any) {
                          alert(`Error replacing PDF: ${err.message}`);
                        } finally {
                          setIsUpdating(false);
                          setUpdateStatus('');
                        }
                      }
                    }} />
                  </label>
                </div>
              </div>

              {editingSong.keys && editingSong.keys.length > 0 && (
                <div className="pt-4 border-t border-outline-variant/15 space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant flex items-center">
                    <KeyRound className="w-4 h-4 mr-2" /> {t('admin.manageKeys')}
                  </h4>
                  <div className="space-y-3">
                    {editingSong.keys.map((k: any) => (
                      <div key={k.id} className="flex items-center justify-between p-2 bg-surface rounded-lg border border-outline-variant/5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm w-8">{k.name}</span>
                          {k.pdfUrl ? (
                            <a href={k.pdfUrl} target="_blank" rel="noreferrer" className="text-[10px] text-primary underline truncate max-w-[100px]">{t('admin.viewKeyPdf')}</a>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant italic">{t('admin.noPdf')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="cursor-pointer p-1.5 hover:bg-surface-container rounded-full transition-colors truncate" title="Replace Key PDF">
                            <Upload className="w-3.5 h-3.5 text-on-surface-variant" />
                            <input type="file" accept=".pdf" className="sr-only" onChange={async (e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                setIsUpdating(true);
                                setUpdateStatus(`Uploading ${k.name} PDF...`);
                                try {
                                  const fileExt = file.name.split('.').pop();
                                  const fileName = `key_${Math.random().toString(36).substring(2)}.${fileExt}`;
                                  const filePath = `pdfs/keys/${editingSong.id}/${fileName}`;
                                  
                                  const { error: uploadError } = await supabase.storage.from('music-sheets').upload(filePath, file);
                                  if (uploadError) throw uploadError;
                                  
                                  const { data: { publicUrl } } = supabase.storage.from('music-sheets').getPublicUrl(filePath);
                                  
                                  const { updateKeyPdf } = useStore.getState();
                                  await updateKeyPdf(k.id, publicUrl);
                                  // No need to manually refresh — reactive editingSong auto-updates
                                  alert(`${k.name} PDF replaced successfully`);
                                } catch (err: any) {
                                  alert(`Error: ${err.message}`);
                                } finally {
                                  setIsUpdating(false);
                                  setUpdateStatus('');
                                }
                              }
                            }} />
                          </label>
                          <button 
                            type="button" 
                            onClick={async () => {
                              if(confirm(`Remove key ${k.name}?`)) {
                                const { removeKey } = useStore.getState();
                                await removeKey(k.id);
                                // No manual refresh needed — reactive editingSong reflects store update
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 flex justify-end gap-2 border-t border-outline-variant/15">
                <button type="button" onClick={() => setEditingSongId(null)} disabled={isUpdating} className="px-4 py-2 hover:bg-surface-container rounded text-on-surface-variant font-medium disabled:opacity-50">{t('admin.cancel')}</button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 bg-primary text-on-primary rounded font-bold shadow hover:bg-primary-container disabled:opacity-50 flex items-center">
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {updateStatus || t('admin.processing')}
                    </>
                  ) : (
                    t('admin.saveBasics')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
