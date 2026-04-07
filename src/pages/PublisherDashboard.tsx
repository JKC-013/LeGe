import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { generatePdfThumbnail } from '../lib/pdfUtils';
import { PlusCircle, KeyRound, CheckCircle2, Upload, Loader2 } from 'lucide-react';

export function PublisherDashboard() {
  const { t } = useTranslation();
  const { addSong, addKeyToSong, songs } = useStore();
  const [activeTab, setActiveTab] = useState<'score' | 'key'>('score');
  const [success, setSuccess] = useState(false);
  const [keySuccess, setKeySuccess] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    audience: 'band' as 'band' | 'worship',
    pdfUrl: '',
    previewUrl: '',
    lyrics: ''
  });

  const [keyPdfFile, setKeyPdfFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [keyData, setKeyData] = useState({
    songId: '',
    keyName: ''
  });

  const COMMON_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm'];

  const filteredSearchSongs = songs.filter(s => 
    s.status === 'approved' && 
    s.audience === 'worship' && 
    (s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    setUploadStatus('1/3: Preparing files...');
    
    try {
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `pdfs/${fileName}`;

      // 1. Generate thumbnail first (locally)
      setUploadStatus('2/3: Generating preview...');
      let thumbnailFile: File | null = null;
      try {
        thumbnailFile = await generatePdfThumbnail(pdfFile);
      } catch (thumbErr) {
        console.warn("Thumbnail generation failed, proceeding without preview:", thumbErr);
      }

      // 2. Parallel upload for speed
      setUploadStatus('3/3: Uploading to cloud...');
      const uploadPromises: Promise<any>[] = [
        supabase.storage.from('music-sheets').upload(filePath, pdfFile)
      ];

      let thumbPath = '';
      if (thumbnailFile) {
        thumbPath = `thumbnails/thumb_${Math.random().toString(36).substring(2)}.jpg`;
        uploadPromises.push(
          supabase.storage.from('music-sheets').upload(thumbPath, thumbnailFile)
        );
      }

      const results = await Promise.all(uploadPromises);
      const mainUploadError = results[0].error;
      if (mainUploadError) throw mainUploadError;

      // 3. Finalize
      const { data: { publicUrl } } = supabase.storage
        .from('music-sheets')
        .getPublicUrl(filePath);

      let finalPreviewUrl = '';
      if (thumbPath) {
        const { data: { publicUrl: thumbPubUrl } } = supabase.storage
          .from('music-sheets')
          .getPublicUrl(thumbPath);
        finalPreviewUrl = thumbPubUrl;
      }

      setUploadStatus('Finalizing...');
      await addSong({ ...formData, pdfUrl: publicUrl, previewUrl: finalPreviewUrl });
      
      setSuccess(true);
      setFormData({
        title: '', author: '', category: '', audience: 'band', pdfUrl: '', previewUrl: '', lyrics: ''
      });
      setPdfFile(null);
    } catch (error: any) {
      console.error('[CRITICAL] Upload Error:', error);
      alert(`Upload failed: ${error?.message || 'Check your Supabase bucket permissions.'}`);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (keyData.songId && keyData.keyName) {
      setIsUploading(true);
      setUploadStatus('1/2: Preparing key file...');
      try {
        let keyPdfUrl = '';
        if (keyPdfFile) {
          const fileExt = keyPdfFile.name.split('.').pop();
          const fileName = `key_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `pdfs/keys/${keyData.songId}/${fileName}`;
          
          setUploadStatus('2/2: Uploading key PDF...');
          const { error: uploadError } = await supabase.storage
            .from('music-sheets')
            .upload(filePath, keyPdfFile);
            
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('music-sheets')
            .getPublicUrl(filePath);
          keyPdfUrl = publicUrl;
        }

        await addKeyToSong(keyData.songId, keyData.keyName, keyPdfUrl);
        setKeySuccess(true);
        setTimeout(() => {
          setKeySuccess(false);
          setKeyData({ songId: '', keyName: '' });
          setKeyPdfFile(null);
          setSearchTerm('');
        }, 3000);
      } catch (err: any) {
        console.error('[CRITICAL] Error adding key:', err);
        alert(`Failed to add key: ${err.message}`);
      } finally {
        setIsUploading(false);
        setUploadStatus('');
      }
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
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-container focus-within:outline-none text-center">
                        <span className="block truncate max-w-xs px-2">{pdfFile ? pdfFile.name : 'Select a PDF file'}</span>
                        <input id="file-upload" name="file-upload" type="file" accept=".pdf" className="sr-only" onChange={handleFileChange} required={!pdfFile} />
                      </label>
                    </div>
                    <p className="text-xs text-outline-variant">{pdfFile ? 'Click to change file' : 'PDF up to 10MB'}</p>
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
                    {uploadStatus || 'Processing...'}
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
                <div className="relative">
                  <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.selectSong')}</label>
                  <input 
                    type="text"
                    placeholder={t('publisher.searchPlaceholder')}
                    className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface"
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                  />
                  {showDropdown && searchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-surface-container-lowest border border-outline-variant/15 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredSearchSongs.length > 0 ? (
                        filteredSearchSongs.map(song => (
                          <button
                            key={song.id}
                            type="button"
                            className={`w-full text-left px-4 py-3 hover:bg-surface-container transition-colors border-b border-outline-variant/5 last:border-0 ${keyData.songId === song.id ? 'bg-primary/5' : ''}`}
                            onClick={() => {
                              setKeyData({ ...keyData, songId: song.id });
                              setSearchTerm(song.title);
                              setShowDropdown(false);
                            }}
                          >
                            <span className="block font-bold text-on-surface">{song.title}</span>
                            <span className="block text-xs text-on-surface-variant font-medium">{song.author}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-on-surface-variant italic">No matches found</div>
                      )}
                    </div>
                  )}
                  {keyData.songId && (
                    <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10 flex justify-between items-center">
                      <span className="text-sm font-bold text-primary">{songs.find(s => s.id === keyData.songId)?.title}</span>
                      <button type="button" onClick={() => { setKeyData({...keyData, songId: ''}); setSearchTerm(''); }} className="text-xs text-primary underline">Clear</button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.keyName')}</label>
                  <select 
                    required 
                    className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface"
                    value={keyData.keyName}
                    onChange={e => setKeyData({...keyData, keyName: e.target.value})}
                  >
                    <option value="" disabled>{t('publisher.selectKey')}</option>
                    {COMMON_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.uploadKeyPdfOptional')}</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-outline-variant/30 border-dashed rounded-xl bg-surface hover:bg-surface-container transition-colors group relative cursor-pointer">
                    <div className="space-y-2 text-center">
                      <Upload className="mx-auto h-10 w-10 text-outline-variant group-hover:text-on-surface-variant transition-colors" />
                      <div className="flex text-sm text-on-surface-variant justify-center">
                        <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-container focus-within:outline-none text-center">
                          <span className="block truncate max-w-xs px-2">{keyPdfFile ? keyPdfFile.name : t('publisher.selectKeyPdf')}</span>
                          <input type="file" accept=".pdf" className="sr-only" onChange={e => e.target.files && setKeyPdfFile(e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isUploading || !keyData.songId || !keyData.keyName}
                  className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-full shadow-ambient text-base font-bold text-on-primary bg-primary hover:bg-primary-container focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {uploadStatus || 'Processing...'}
                    </>
                  ) : (
                    t('publisher.addKeySubmit')
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
