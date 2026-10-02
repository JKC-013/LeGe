import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { ArrowLeft, Star, Mic, Download, Copy, Check, Maximize2, X, ChevronDown, FileQuestion } from 'lucide-react';
import { PdfViewer } from '../components/PdfViewer';
import { parseSongPdfs } from '../lib/songHelpers';

export function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { songs, currentUser, toggleFavourite } = useStore();
  
  const [copied, setCopied] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>('Empty');
  const [selectedVersion, setSelectedVersion] = useState<string>('Empty');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const song = songs.find(s => s.id === id);
  const parsed = parseSongPdfs(song?.pdfUrl, song?.versions);

  // 1. Calculate versions that actually have sheet music (including Vietnamese, Mandarin, Cantonese only if they have sheets)
  const versionsWithSheets = React.useMemo(() => {
    if (!song) return [];
    const validFromPdfs = Object.entries(parsed.versionPdfs)
      .filter(([_, url]) => typeof url === 'string' && url.trim().length > 0)
      .map(([version]) => version);

    if (validFromPdfs.length > 0) {
      const ordered: string[] = [];
      (song.versions || []).forEach(v => {
        if (validFromPdfs.includes(v) && !ordered.includes(v)) {
          ordered.push(v);
        }
      });
      validFromPdfs.forEach(v => {
        if (!ordered.includes(v)) {
          ordered.push(v);
        }
      });
      return ordered;
    }

    if (parsed.defaultPdf && parsed.defaultPdf.trim().length > 0) {
      const fallbackVersion = (song.versions && song.versions.length > 0) ? song.versions[0] : 'Vietnamese';
      return [fallbackVersion];
    }

    return [];
  }, [song, parsed]);

  // 2. Calculate keys that actually have sheet music for the selected version
  const keysWithSheets = React.useMemo(() => {
    if (!song || !selectedVersion || selectedVersion === 'Empty' || !versionsWithSheets.includes(selectedVersion)) {
      return [];
    }

    const directKey = parsed.versionKeys[selectedVersion]?.trim();
    if (directKey) {
      return directKey.includes(',')
        ? directKey.split(',').map(k => k.trim()).filter(Boolean)
        : [directKey];
    }

    const keysAssignedToOthers = Object.entries(parsed.versionKeys)
      .filter(([v, k]) => v !== selectedVersion && Boolean(k?.trim()))
      .map(([_, k]) => k.trim());

    const available = (song.keys || []).filter(k => Boolean(k?.trim()) && !keysAssignedToOthers.includes(k.trim()));
    if (available.length > 0) {
      return available;
    }

    if (song.keys && song.keys.length > 0) {
      return song.keys.filter(k => Boolean(k?.trim()));
    }

    return [];
  }, [song, selectedVersion, parsed, versionsWithSheets]);

  useEffect(() => {
    if (song) {
      if (versionsWithSheets.length > 0) {
        const nextVersion = versionsWithSheets.includes(selectedVersion)
          ? selectedVersion
          : versionsWithSheets[0];
        setSelectedVersion(nextVersion);

        const directKey = parsed.versionKeys[nextVersion]?.trim();
        if (directKey) {
          const keys = directKey.includes(',') ? directKey.split(',').map(k => k.trim()).filter(Boolean) : [directKey];
          setSelectedKey(keys[0] || 'Empty');
        } else {
          const keysAssignedToOthers = Object.entries(parsed.versionKeys)
            .filter(([v, k]) => v !== nextVersion && Boolean(k?.trim()))
            .map(([_, k]) => k.trim());
          const available = (song.keys || []).filter(k => Boolean(k?.trim()) && !keysAssignedToOthers.includes(k.trim()));
          if (available.length > 0) {
            setSelectedKey(available[0]);
          } else if (song.keys && song.keys.length > 0) {
            setSelectedKey(song.keys[0]);
          } else {
            setSelectedKey('Empty');
          }
        }
      } else {
        setSelectedVersion('Empty');
        setSelectedKey('Empty');
      }
    }
  }, [song?.id, song?.pdfUrl, versionsWithSheets.join(',')]);

  if (!song) {
    return <div className="text-center py-12 text-outline-variant text-lg">{t('song.notFound')}</div>;
  }

  const handleVersionChange = (newVersion: string) => {
    setSelectedVersion(newVersion);
    const directKey = parsed.versionKeys[newVersion]?.trim();
    if (directKey) {
      const keys = directKey.includes(',') ? directKey.split(',').map(k => k.trim()).filter(Boolean) : [directKey];
      setSelectedKey(keys[0] || 'Empty');
    } else {
      const keysAssignedToOthers = Object.entries(parsed.versionKeys)
        .filter(([v, k]) => v !== newVersion && Boolean(k?.trim()))
        .map(([_, k]) => k.trim());
      const available = (song.keys || []).filter(k => Boolean(k?.trim()) && !keysAssignedToOthers.includes(k.trim()));
      if (available.length > 0) {
        setSelectedKey(available[0]);
      } else if (song.keys && song.keys.length > 0) {
        setSelectedKey(song.keys[0]);
      } else {
        setSelectedKey('Empty');
      }
    }
  };

  const isFav = currentUser?.favourites.includes(song.id);
  const isInQueue = useStore(state => state.requestQueue.includes(song.id));
  const hasVersion = versionsWithSheets.includes(selectedVersion);
  const activePdfUrl = hasVersion
    ? (parsed.versionPdfs[selectedVersion] || (versionsWithSheets.length === 1 ? parsed.defaultPdf : ''))
    : '';

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
            {activePdfUrl ? (
              <a 
                href={activePdfUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-ambient"
              >
                <Download className="w-5 h-5" />
              </a>
            ) : (
              <button 
                disabled
                className="p-3 rounded-full bg-surface-container text-on-surface-variant/40 cursor-not-allowed"
                title={t('song.empty')}
              >
                <Download className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap gap-6 mb-8 p-4 bg-surface-container rounded-xl border border-outline-variant/15">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-on-surface-variant mb-1">{t('song.version')}</label>
            <div className="relative">
              <select 
                value={versionsWithSheets.length === 0 ? "Empty" : selectedVersion}
                onChange={(e) => handleVersionChange(e.target.value)}
                disabled={versionsWithSheets.length === 0}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-primary appearance-none cursor-pointer hover:bg-surface-container-highest transition-colors disabled:opacity-50"
              >
                {versionsWithSheets.length === 0 ? (
                  <option value="Empty">{t('song.empty')}</option>
                ) : (
                  versionsWithSheets.map(v => (
                    <option key={v} value={v}>
                      {['Mandarin', 'Cantonese', 'Vietnamese'].includes(v)
                        ? t(`song.${v.toLowerCase()}` as any, { defaultValue: v })
                        : v}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-on-surface-variant mb-1">{t('song.key')}</label>
            <div className="relative">
              <select 
                value={keysWithSheets.length === 0 ? "Empty" : selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                disabled={keysWithSheets.length === 0}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-primary appearance-none cursor-pointer hover:bg-surface-container-highest transition-colors disabled:opacity-50"
              >
                {keysWithSheets.length === 0 ? (
                  <option value="Empty">{t('song.empty')}</option>
                ) : (
                  keysWithSheets.map(k => <option key={k} value={k}>{k}</option>)
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
          {activePdfUrl ? (
            <PdfViewer url={activePdfUrl} />
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
