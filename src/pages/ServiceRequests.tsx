import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { Calendar, MessageSquare, Trash2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export function ServiceRequests() {
  const { t } = useTranslation();
  const { currentUser, serviceRequests, requestQueue, songs, removeFromRequestQueue, submitServiceRequest, users, approveServiceRequest, declineServiceRequest } = useStore();
  
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!currentUser) {
    return <div className="text-center py-12">Please sign in to view requests.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setIsSubmitting(true);
    await submitServiceRequest(date, message);
    setIsSubmitting(false);
    setSuccess(true);
    setDate('');
    setMessage('');
    setTimeout(() => setSuccess(false), 3000);
  };

  const isPastor = currentUser.role === 'pastor';

  if (isPastor) {
    const pendingRequests = serviceRequests.filter(r => r.status === 'pending');
    
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/songs" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('song.back') || 'Back'}
        </Link>
        <h1 className="text-3xl font-display font-bold text-on-surface">{t('requests.approveTitle')}</h1>
        {pendingRequests.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-ambient">
            <p className="text-xl text-on-surface-variant font-medium">{t('requests.noPending')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(req => {
              const reqUser = users.find(u => u.id === req.user_id);
              const reqSongs = req.song_ids.map(id => songs.find(s => s.id === id)).filter(Boolean);
              
              return (
                <div key={req.id} className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-on-surface-variant mb-1">
                        {t('requests.requestedBy')} <span className="font-bold text-on-surface">{reqUser?.name || reqUser?.email || t('admin.unknown')}</span>
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {t('requests.forDate')} <span className="font-bold text-on-surface">{req.date}</span>
                      </p>
                    </div>
                  </div>
                  
                  {req.message && (
                    <div className="bg-surface p-4 rounded-xl mb-4 border border-outline-variant/15 text-on-surface-variant text-sm">
                      <MessageSquare className="w-4 h-4 inline-block mr-2" />
                      "{req.message}"
                    </div>
                  )}

                  <div className="space-y-2 mb-6">
                    <p className="text-sm font-medium text-on-surface">{t('requests.requestedSongs')}</p>
                    {reqSongs.map((song: any) => (
                      <Link key={song.id} to={`/song/${song.id}`} target="_blank" className="block p-3 rounded-lg bg-surface hover:bg-surface-container transition-colors border border-outline-variant/15">
                        <span className="font-medium text-on-surface">{song.title}</span>
                        <span className="text-sm text-on-surface-variant ml-2">- {song.organization}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <textarea 
                      placeholder={t('requests.leaveMessage')} 
                      maxLength={500}
                      className="w-full bg-surface border border-outline-variant/30 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none"
                      rows={3}
                    ></textarea>
                    <div className="flex justify-end space-x-3">
                      <button onClick={() => declineServiceRequest(req.id)} className="px-4 py-2 bg-error/10 text-error hover:bg-error/20 rounded-lg text-sm font-bold flex items-center transition-colors">
                        <XCircle className="w-4 h-4 mr-2" /> {t('requests.decline')}
                      </button>
                      <button onClick={() => approveServiceRequest(req.id)} className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-sm font-bold flex items-center shadow-ambient transition-colors">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> {t('requests.approve')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Normal User View
  const queuedSongs = requestQueue.map(id => songs.find(s => s.id === id)).filter(Boolean);
  const myRequests = serviceRequests.filter(r => r.user_id === currentUser.id);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <Link to="/songs" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('song.back') || 'Back'}
      </Link>
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold text-on-surface">{t('requests.create')}</h1>
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center shadow-sm">
            <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" />
            {t('requests.success')}
          </div>
        )}

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient border border-outline-variant/10">
          {queuedSongs.length === 0 ? (
            <p className="text-on-surface-variant">{t('requests.emptyCart')}</p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-on-surface">{t('requests.selectedSongs')}</p>
                {queuedSongs.map((song: any) => (
                  <div key={song.id} className="flex justify-between items-center p-3 rounded-lg bg-surface border border-outline-variant/15">
                    <span className="font-medium text-on-surface">{song.title}</span>
                    <button onClick={() => removeFromRequestQueue(song.id)} className="text-error hover:bg-error/10 p-2 rounded-full transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">{t('requests.date')}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant/30 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">{t('requests.messageLabel')}</label>
                  <textarea 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full p-3 bg-surface border border-outline-variant/30 rounded-lg focus:outline-none focus:border-primary resize-none"
                    placeholder={t('requests.messagePlaceholder')}
                  ></textarea>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold shadow-ambient hover:bg-primary-container transition-colors disabled:opacity-50">
                  {isSubmitting ? t('requests.sending') : t('requests.send')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {myRequests.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold text-on-surface">{t('requests.past')}</h2>
          <div className="space-y-4">
            {myRequests.map(req => (
              <div key={req.id} className="bg-surface-container-lowest p-5 rounded-2xl shadow-ambient flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-on-surface mb-1">{t('requests.forDate')} {req.date}</p>
                  <p className="text-xs text-on-surface-variant mb-2">{req.song_ids.length} {t('requests.songsCount')}</p>
                  {req.message && <p className="text-sm text-on-surface-variant italic">"{req.message}"</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-error/10 text-error'}`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
