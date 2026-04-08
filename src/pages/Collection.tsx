import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { ArrowLeft, Send, Settings2, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Collection() {
  const { t } = useTranslation();
  const { currentUser, userCollection, songs, removeFromCollection, submitToWorship } = useStore();
  const navigate = useNavigate();
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const collectionSongs = userCollection.map(item => 
    songs.find(s => s.id === item.songId)
  ).filter(Boolean);

  const handleSelectSong = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSongs.size === collectionSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(collectionSongs.map(s => s!.id)));
    }
  };

  const handleSubmitToWorship = async () => {
    if (selectedSongs.size === 0) {
      alert(t('collection.emptyCollection'));
      return;
    }

    setIsSubmitting(true);
    try {
      await submitToWorship(Array.from(selectedSongs));
      setSelectedSongs(new Set());
      alert(t('collection.submissionSuccess'));
    } catch (err: any) {
      alert(err.message || 'Error submitting');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <button onClick={() => navigate('/')} className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('song.back')}
        </button>
        <div className="text-center py-12 text-outline-variant">
          {t('favourites.login')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button onClick={() => navigate('/')} className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('song.back')}
      </button>

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-display font-bold text-on-surface">{t('collection.myCollection')}</h1>
        <p className="text-on-surface-variant">{collectionSongs.length} {t('collection.myCollection')}</p>
      </div>

      {collectionSongs.length === 0 ? (
        <div className="text-center py-12 text-outline-variant text-lg">{t('collection.emptyCollection')}</div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-surface-container-lowest rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedSongs.size === collectionSongs.length && collectionSongs.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 rounded border-2 border-primary accent-primary"
              />
              <span className="text-sm font-medium text-on-surface">
                {selectedSongs.size > 0 && `${selectedSongs.size}/${collectionSongs.length}`}
              </span>
            </label>

            {selectedSongs.size > 0 && (
              <button
                onClick={handleSubmitToWorship}
                disabled={isSubmitting}
                className="ml-auto flex items-center gap-2 px-6 py-2 bg-primary text-on-primary text-sm font-bold rounded-full hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t('collection.submitToWorship')}
              </button>
            )}
          </div>

          {/* Song List */}
          <div className="space-y-3">
            {collectionSongs.map((song) => (
              <div key={song!.id} className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-outline-variant/15 hover:border-primary/30 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedSongs.has(song!.id)}
                  onChange={() => handleSelectSong(song!.id)}
                  className="w-5 h-5 rounded border-2 border-primary accent-primary cursor-pointer"
                />
                
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/song/${song!.id}`)}
                    className="text-lg font-bold text-on-surface hover:text-primary transition-colors text-left truncate block"
                  >
                    {song!.title}
                  </button>
                  <p className="text-sm text-on-surface-variant truncate">
                    {song!.author} • {song!.category} • {song!.audience}
                  </p>
                  <p className="text-xs text-outline-variant mt-1">
                    {song!.keys?.length || 0} {t('admin.keysLabel')} • {t('collection.pickedCount', { count: song!.pickCount || 0 })}
                  </p>
                </div>

                <button
                  onClick={() => removeFromCollection(song!.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                  title={t('collection.removeFromCollection')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
