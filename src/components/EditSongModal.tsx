import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Song, useStore } from '../store';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface EditSongModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSong: Partial<Song>) => Promise<void>;
}

const PREDEFINED_VERSIONS = ['Mandarin', 'Cantonese', 'Vietnamese'];
const PREDEFINED_KEYS = ['Dd', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#-Gb'];

export function EditSongModal({ song, isOpen, onClose, onSave }: EditSongModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    category: '',
    version: '',
    key: '',
    lyrics: ''
  });

  const [useCustomVersion, setUseCustomVersion] = useState(false);
  const [customVersion, setCustomVersion] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (song) {
      const v = (song.versions && song.versions.length > 0) ? song.versions[0] : 'Vietnamese';
      const k = (song.keys && song.keys.length > 0) ? song.keys[0] : 'C';
      setFormData({
        title: song.title,
        organization: song.organization,
        category: song.category,
        version: v,
        key: k,
        lyrics: song.lyrics || ''
      });
      if (!PREDEFINED_VERSIONS.includes(v)) {
        setUseCustomVersion(true);
        setCustomVersion(v);
      } else {
        setUseCustomVersion(false);
        setCustomVersion('');
      }
    }
  }, [song]);

  if (!isOpen || !song) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const finalVersion = useCustomVersion ? customVersion : formData.version;
    await onSave({
      title: formData.title,
      organization: formData.organization,
      category: formData.category,
      versions: [finalVersion],
      keys: [formData.key],
      lyrics: formData.lyrics
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-ambient relative my-8">
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/15">
          <h2 className="text-xl font-bold text-on-surface">{t('admin.edit')}: {song.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.songName')}</label>
              <input required type="text" className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.organization')}</label>
              <input required type="text" className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none" value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.category')}</label>
              <div className="relative">
                <select className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 pl-4 pr-10 focus:outline-none text-base transition-colors text-on-surface appearance-none cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Worship">{t('song.worship')}</option>
                  <option value="Others">{t('song.others')}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.version')}</label>
              {!useCustomVersion ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 pl-4 pr-10 focus:outline-none text-base transition-colors text-on-surface appearance-none cursor-pointer" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})}>
                      {PREDEFINED_VERSIONS.map(v => <option key={v} value={v}>{t(`song.${v.toLowerCase()}` as any, { defaultValue: v })}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
                  </div>
                  <button type="button" onClick={() => setUseCustomVersion(true)} className="px-4 py-2 bg-surface-container rounded-lg text-sm font-medium hover:bg-surface-container-high">{t('publisher.custom')}</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input required type="text" placeholder={t('publisher.custom')} className="block flex-1 bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none" value={customVersion} onChange={e => setCustomVersion(e.target.value)} />
                  <button type="button" onClick={() => setUseCustomVersion(false)} className="px-4 py-2 bg-surface-container rounded-lg text-sm font-medium hover:bg-surface-container-high">{t('publisher.cancel')}</button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.key')}</label>
              <div className="relative">
                <select className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 pl-4 pr-10 focus:outline-none text-base transition-colors text-on-surface appearance-none cursor-pointer" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})}>
                  {PREDEFINED_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.lyrics')}</label>
              <textarea rows={6} className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none" value={formData.lyrics} onChange={e => setFormData({...formData, lyrics: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-outline-variant/15">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">{t('publisher.cancel')}</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-full font-bold text-on-primary bg-primary hover:bg-primary-container transition-colors disabled:opacity-50">
              {isSaving ? t('requests.sending') : t('publisher.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
