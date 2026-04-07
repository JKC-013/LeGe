import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { PlusCircle, KeyRound, CheckCircle2, Upload, Loader2 } from 'lucide-react';

export function PublisherDashboard() {
  const { t } = useTranslation();
  const { addSong, addKeyToSong, songs } = useStore();
  const [activeTab, setActiveTab] = useState<'score' | 'key'>('score');
  const [success, setSuccess] = useState(false);
  const [keySuccess, setKeySuccess] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    audience: 'band' as 'band' | 'worship',
    pdfUrl: '',
    previewUrl: '',
    lyrics: ''
  });

  const [keyData, setKeyData] = useState({
    songId: '',
    keyName: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      alert('Please select a PDF file.');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `pdfs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('music-sheets')
        .upload(filePath, pdfFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('music-sheets')
        .getPublicUrl(filePath);

      await addSong({ ...formData, pdfUrl: publicUrl });
      
      setSuccess(true);
      setFormData({
        title: '', author: '', category: '', audience: 'band', pdfUrl: '', previewUrl: '', lyrics: ''
      });
      setPdfFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please check if the "music-sheets" bucket exists and is public.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyData.songId && keyData.keyName) {
      addKeyToSong(keyData.songId, keyData.keyName);
      setKeySuccess(true);
      setTimeout(() => {
        setKeySuccess(false);
        setKeyData({ songId: '', keyName: '' });
      }, 3000);
    }
  };

  const approvedWorshipSongs = songs.filter(s => s.status === 'approved' && s.audience === 'worship');

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">{t('publisher.title')}</h1>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex bg-surface-container p-1 rounded-full">
          <button
            className={`px-8 py-3 text-sm font-medium rounded-full transition-all flex items-center space-x-2 ${
              activeTab === 'score'
                ? 'bg-primary text-on-primary shadow-ambient'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
            onClick={() => setActiveTab('score')}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('publisher.addScore')}</span>
          </button>
          <button
            className={`px-8 py-3 text-sm font-medium rounded-full transition-all flex items-center space-x-2 ${
              activeTab === 'key'
                ? 'bg-primary text-on-primary shadow-ambient'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
            onClick={() => setActiveTab('key')}
          >
            <KeyRound className="w-4 h-4" />
            <span>{t('publisher.addNewKey')}</span>
          </button>
        </div>
      </div>

      {activeTab === 'score' && (
        <div className="space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center shadow-sm">
              <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" />
              {t('publisher.success')}
            </div>
          )}
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl shadow-ambient p-8 space-y-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-on-surface mb-3">{t('publisher.audience')}</label>
                <div className="flex space-x-6">
                  <label className="flex items-center cursor-pointer group">
                    <input type="radio" className="text-primary focus:ring-primary w-4 h-4" name="audience" checked={formData.audience === 'band'} onChange={() => setFormData({...formData, audience: 'band'})} />
                    <span className="ml-2 text-base text-on-surface-variant group-hover:text-on-surface transition-colors">{t('home.tab.band')}</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input type="radio" className="text-primary focus:ring-primary w-4 h-4" name="audience" checked={formData.audience === 'worship'} onChange={() => setFormData({...formData, audience: 'worship'})} />
                    <span className="ml-2 text-base text-on-surface-variant group-hover:text-on-surface transition-colors">{t('home.tab.worship')}</span>
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.songName')}</label>
                <input required type="text" className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.author')}</label>
                <input required type="text" className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.category')}</label>
                <input required type="text" className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.uploadPdf')}</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-outline-variant/30 border-dashed rounded-xl bg-surface hover:bg-surface-container transition-colors group relative cursor-pointer">
                  <div className="space-y-2 text-center">
                    <Upload className="mx-auto h-10 w-10 text-outline-variant group-hover:text-on-surface-variant transition-colors" />
                    <div className="flex text-sm text-on-surface-variant justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-container focus-within:outline-none">
                        <span>{formData.pdfUrl ? 'PDF Selected' : 'Upload a file'}</span>
                        <input id="file-upload" name="file-upload" type="file" accept=".pdf" className="sr-only" onChange={handleFileChange} required={!formData.pdfUrl} />
                      </label>
                    </div>
                    <p className="text-xs text-outline-variant">PDF up to 10MB</p>
                  </div>
                </div>
              </div>

              {formData.audience === 'worship' && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.lyrics')}</label>
                  <textarea rows={6} className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface" value={formData.lyrics} onChange={e => setFormData({...formData, lyrics: e.target.value})} />
                </div>
              )}
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isUploading || !pdfFile}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-full shadow-ambient text-base font-bold text-on-primary bg-primary hover:bg-primary-container focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  t('publisher.submit')
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'key' && (
        <div className="space-y-6">
          {keySuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center shadow-sm">
              <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" />
              {t('publisher.keySuccess')}
            </div>
          )}
          
          {approvedWorshipSongs.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-12 text-center text-outline-variant">
              <KeyRound className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">{t('publisher.noSongs')}</p>
            </div>
          ) : (
            <form onSubmit={handleKeySubmit} className="bg-surface-container-lowest rounded-2xl shadow-ambient p-8 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.selectSong')}</label>
                  <select 
                    required 
                    className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface"
                    value={keyData.songId}
                    onChange={e => setKeyData({...keyData, songId: e.target.value})}
                  >
                    <option value="" disabled>-- {t('publisher.selectSong')} --</option>
                    {approvedWorshipSongs.map(song => (
                      <option key={song.id} value={song.id}>{song.title} ({song.author})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.keyName')}</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. G, Am, Bb"
                    className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface" 
                    value={keyData.keyName} 
                    onChange={e => setKeyData({...keyData, keyName: e.target.value})} 
                  />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-ambient text-base font-bold text-on-primary bg-primary hover:bg-primary-container focus:outline-none transition-colors">
                  {t('publisher.addKeySubmit')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
