import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Upload, Loader2, Music, ChevronDown, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generatePdfThumbnail } from '../lib/pdfThumbnail';

const PREDEFINED_VERSIONS = ['Mandarin', 'Cantonese', 'Vietnamese'];
const PREDEFINED_KEYS = ['Dd', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#-Gb'];

export function PublisherDashboard() {
  const { t } = useTranslation();
  const { addSong } = useStore();
  const [success, setSuccess] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  
  const [useCustomVersion, setUseCustomVersion] = useState(false);
  const [customVersion, setCustomVersion] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    category: 'Worship',
    version: 'Vietnamese',
    key: 'C',
    lyrics: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setSuccess(false);
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
        .upload(filePath, pdfFile, {
          contentType: 'application/pdf',
          upsert: true
        });
      if (uploadError) {
        console.error('Upload Error:', uploadError);
        throw uploadError;
      }
      const { data: { publicUrl } } = supabase.storage
        .from('music-sheets')
        .getPublicUrl(filePath);

      let thumbnailUrl = undefined;
      try {
        // generatePdfThumbnail now returns a base64 Data URL
        thumbnailUrl = await generatePdfThumbnail(pdfFile);
        } catch (err) {
        console.error('6. Failed to generate thumbnail', err);
      }

      const finalVersion = useCustomVersion ? customVersion : formData.version;

      await addSong({ 
        title: formData.title,
        organization: formData.organization,
        category: formData.category,
        versions: [finalVersion],
        keys: [formData.key],
        pdfUrl: publicUrl,
        thumbnailUrl,
        lyrics: formData.lyrics
      });
      
      setSuccess(true);
      setFormData({
        title: '', organization: '', category: 'Worship', version: 'Vietnamese', key: 'C', lyrics: ''
      });
      setCustomVersion('');
      setUseCustomVersion(false);
      setPdfFile(null);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Error uploading file: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    } finally {
      setIsUploading(false);
      
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">{t('publisher.title')}</h1>
      </div>

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
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.uploadPdf')}</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-outline-variant/30 border-dashed rounded-xl bg-surface hover:bg-surface-container transition-colors group relative cursor-pointer">
                <div className="space-y-2 text-center">
                  <Upload className="mx-auto h-10 w-10 text-outline-variant group-hover:text-on-surface-variant transition-colors" />
                  <div className="flex text-sm text-on-surface-variant justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-container focus-within:outline-none">
                      <span>{pdfFile ? pdfFile.name : t('publisher.uploadPdf')}</span>
                      <input id="file-upload" name="file-upload" type="file" accept=".pdf" className="sr-only" onChange={handleFileChange} required={!pdfFile} />
                    </label>
                  </div>
                  <p className="text-xs text-outline-variant">{t('publisher.pdfLimit')}</p>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.songName')}</label>
              <input required type="text" className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.organization')}</label>
              <input required type="text" className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface" value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.category')}</label>
              <div className="relative">
                <select className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 pl-4 pr-10 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface appearance-none cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
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
                    <select className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 pl-4 pr-10 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface appearance-none cursor-pointer" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})}>
                      {PREDEFINED_VERSIONS.map(v => <option key={v} value={v}>{t(`song.${v.toLowerCase()}` as any, { defaultValue: v })}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
                  </div>
                  <button type="button" onClick={() => setUseCustomVersion(true)} className="px-4 py-2 bg-surface-container rounded-lg text-sm font-medium hover:bg-surface-container-high">{t('publisher.custom')}</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input required type="text" placeholder={t('publisher.custom')} className="block flex-1 bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface" value={customVersion} onChange={e => setCustomVersion(e.target.value)} />
                  <button type="button" onClick={() => setUseCustomVersion(false)} className="px-4 py-2 bg-surface-container rounded-lg text-sm font-medium hover:bg-surface-container-high">{t('publisher.cancel')}</button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.key')}</label>
              <div className="relative">
                <select className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 pl-4 pr-10 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface appearance-none cursor-pointer" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})}>
                  {PREDEFINED_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-on-surface mb-2">{t('publisher.lyrics')} (Optional)</label>
              <textarea rows={6} className="block w-full bg-surface-container-highest border-b-2 border-transparent focus:border-primary rounded-t-xl rounded-b-sm py-3 px-4 focus:outline-none focus:ring-0 text-base transition-colors text-on-surface" value={formData.lyrics} onChange={e => setFormData({...formData, lyrics: e.target.value})} />
            </div>
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
                  {t('requests.sending')}
                </>
              ) : (
                t('publisher.submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
