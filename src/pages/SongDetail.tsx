import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { ArrowLeft, Star, Mic, Download, Copy, Check, Maximize2, X, ChevronDown, FileQuestion } from 'lucide-react';
import { PdfViewer } from '../components/PdfViewer';

export function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { songs, currentUser, toggleFavourite } = useStore();
  
  const [copied, setCopied] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>('Empty');
  const [selectedVersion, setSelectedVersion] = useState<string>('Empty');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const song = songs.find(s => s.id === id);

  useEffect(() => {
    if (song) {
      if (song.keys && song.keys.length > 0) setSelectedKey(song.keys[0]);
      if (song.versions && song.versions.length > 0) setSelectedVersion(song.versions[0]);
      else setSelectedVersion('Vietnamese'); 
    }
  }, [song]);

  if (!song) {
    return <div className="text-center py-12 text-outline-variant text-lg">{t('song.notFound')}</div>;
  }

  const isFav = currentUser?.favourites.includes(song.id);
  const isInQueue = useStore(state => state.requestQueue.includes(song.id));

  const handleCopy = () => {
    if (song.lyrics) {
      navigator.clipboard.writeText(song.lyrics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMicClick = () => {
    if (!currentUser) {
      alert(t("song.loginFirst"));
      return;
    }
    const store = useStore.getState();
    if (isInQueue) {
      store.removeFromRequestQueue(song.id);
    } else {
      store.addToRequestQueue(song.id);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto space-y-8 ${isFullscreen ? 'fixed inset-0 z-50 bg-surface overflow-y-auto p-4 m-0 max-w-none' : ''}`}>
      
      {!isFullscreen && (
        <Link to="/songs" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('song.back')}
        </Link>
      )}

      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-6 sm:p-10 border border-outline-variant/10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-on-surface mb-2">{song.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-on-surface-variant">
              <span className="flex items-center"><span className="font-medium mr-2">{t('song.organization')}:</span> {song.organization}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
              <span className="flex items-center"><span className="font-medium mr-2">{t('song.category')}:</span> {song.category}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {currentUser && (
              <>
                <button 
                  onClick={handleMicClick}
                  className={`p-3 rounded-full transition-colors ${isInQueue ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary'}`}
                  title={t('song.requestApproval')}
                >
                  <Mic className="w-5 h-5" fill={isInQueue ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={() => toggleFavourite(song.id)}
                  className={`p-3 rounded-full transition-colors ${isFav ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary'}`}
                >
                  <Star className="w-5 h-5" fill={isFav ? "currentColor" : "none"} />
                </button>
              </>
            )}
            <a 
              href={song.pdfUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-ambient"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap gap-6 mb-8 p-4 bg-surface-container rounded-xl border border-outline-variant/15">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-on-surface-variant mb-1">{t('song.version')}</label>
            <div className="relative">
              <select 
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-primary appearance-none cursor-pointer hover:bg-surface-container-highest transition-colors"
              >
                {(!song.versions || song.versions.length === 0) ? (
                  <option value="Empty">{t('song.empty')}</option>
                ) : (
                  <>
                    <option value="Mandarin">{t('song.mandarin')}</option>
                    <option value="Cantonese">{t('song.cantonese')}</option>
                    <option value="Vietnamese">{t('song.vietnamese')}</option>
                    {song.versions.filter(v => !['Mandarin', 'Cantonese', 'Vietnamese'].includes(v)).map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-on-surface-variant mb-1">{t('song.key')}</label>
            <div className="relative">
              <select 
                value={(!song.keys || song.keys.length === 0 || !song.versions?.includes(selectedVersion)) ? "Empty" : selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-primary appearance-none cursor-pointer hover:bg-surface-container-highest transition-colors"
              >
                {(!song.keys || song.keys.length === 0 || !song.versions?.includes(selectedVersion)) ? (
                  <option value="Empty">{t('song.empty')}</option>
                ) : (
                  song.keys.map(k => <option key={k} value={k}>{k}</option>)
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="relative aspect-[1/1.4] sm:aspect-[16/9] w-full bg-surface-container border border-outline-variant/20 rounded-xl overflow-hidden mb-12 group">
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-3 bg-surface/80 backdrop-blur-md text-on-surface hover:text-primary rounded-xl shadow-ambient border border-outline-variant/20"
            >
              {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
          {(song.pdfUrl && song.versions?.includes(selectedVersion)) ? (
            <PdfViewer url={song.pdfUrl} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant bg-surface">
              <FileQuestion className="w-16 h-16 mb-4 text-outline-variant opacity-50" />
              <p className="text-lg font-medium">{t("song.empty")}</p>
            </div>
          )}
        </div>

        {/* Lyrics Section */}
        <div className="pt-8 border-t border-outline-variant/15">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-semibold text-on-surface">{t('song.lyrics')}</h3>
            {song.lyrics && (
              <button 
                onClick={handleCopy}
                className="inline-flex items-center px-4 py-2 border border-outline-variant/30 rounded-lg text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                {t('song.copyLyrics')}
              </button>
            )}
          </div>
          
          <div className="bg-surface-container p-6 sm:p-8 rounded-xl border border-outline-variant/15 whitespace-pre-wrap font-serif text-lg leading-relaxed text-on-surface">
            {song.lyrics || <span className="text-on-surface-variant italic">{t('song.empty')}</span>}
          </div>
        </div>

      </div>
    </div>
  );
}
