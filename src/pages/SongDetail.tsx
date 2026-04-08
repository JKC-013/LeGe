import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { ArrowLeft, Star, FileText, Copy, Check, ExternalLink, ChevronDown } from 'lucide-react';

export function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { songs, currentUser, toggleFavourite } = useStore();
  const [copied, setCopied] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [isKeyDropdownOpen, setIsKeyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsKeyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const song = songs.find(s => s.id === id);

  if (!song) {
    return <div className="text-center py-12 text-outline-variant text-lg">{t('song.notFound')}</div>;
  }

  const isFav = currentUser?.favourites.includes(song.id);

  const handleCopy = () => {
    if (song.lyrics) {
      navigator.clipboard.writeText(song.lyrics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('song.back')}
      </Link>

      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-6 sm:p-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-display font-bold text-on-surface mb-2">{song.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-on-surface-variant">
                  <span className="flex items-center"><span className="font-medium mr-2">{t('song.author')}:</span> {song.author}</span>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <span className="flex items-center"><span className="font-medium mr-2">{t('song.category')}:</span> {song.category}</span>
                </div>
              </div>
              {currentUser && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleFavourite(song.id)}
                    className={`p-3 rounded-full transition-all ${isFav ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-outline-variant hover:bg-surface-container hover:text-on-surface-variant'}`}
                    title={t('nav.favourites')}
                  >
                    <Star className="w-6 h-6" fill={isFav ? "currentColor" : "none"} />
                  </button>
                </div>
              )}
            </div>

            {song.audience === 'worship' && song.keys && song.keys.length > 0 && (
              <div className="pt-4 border-t border-outline-variant/15">
                <label className="block text-sm font-medium text-on-surface mb-2">{t('song.key')}</label>
                <div className="relative max-w-xs" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsKeyDropdownOpen(!isKeyDropdownOpen)}
                    className="w-full flex items-center justify-between pl-4 pr-3 py-3 text-base bg-surface-container-highest hover:bg-surface-container-high border-b-2 border-transparent focus:border-primary focus:outline-none sm:text-sm rounded-t-xl rounded-b-sm text-on-surface transition-colors"
                  >
                    <span>{selectedKeyId ? song.keys.find(k => k.id === selectedKeyId)?.name : t('song.originalKey')}</span>
                    <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${isKeyDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isKeyDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/15 overflow-hidden py-1">
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedKeyId === '' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-surface-container'}`}
                        onClick={() => { setSelectedKeyId(''); setIsKeyDropdownOpen(false); }}
                      >
                        {t('song.originalKey')}
                      </button>
                      {song.keys.map(k => (
                        <button
                          key={k.id}
                          type="button"
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedKeyId === k.id ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-surface-container'}`}
                          onClick={() => { setSelectedKeyId(k.id); setIsKeyDropdownOpen(false); }}
                        >
                          {k.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-6 flex gap-4">
              <a 
                href={selectedKeyId ? (song.keys.find(k => k.id === selectedKeyId)?.pdfUrl || song.pdfUrl) : song.pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-bold rounded-full shadow-ambient text-on-primary bg-primary hover:bg-primary-container transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                {t('song.viewFull')}
                <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
              </a>
            </div>
          </div>

          <div className="md:w-1/3 shrink-0">
            <div className="aspect-[3/4] bg-surface-container rounded-xl overflow-hidden relative shadow-sm">
              {song.previewUrl ? (
                <img src={song.previewUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-outline-variant">
                  {t('song.preview')}
                </div>
              )}
            </div>
          </div>
        </div>

        {song.audience === 'worship' && song.lyrics && (
          <div className="mt-12 pt-8 border-t border-[#E5E0D8]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-[#2C3E38]">{t('song.lyrics')}</h3>
              <button 
                onClick={handleCopy}
                className="inline-flex items-center px-3 py-1.5 border border-[#E5E0D8] shadow-sm text-sm font-medium rounded-md text-[#5C7268] bg-white hover:bg-[#F0EBE1] focus:outline-none transition-colors"
              >
                {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                {t('song.copyLyrics')}
              </button>
            </div>
            <div className="bg-[#FDFBF7] p-6 rounded-lg border border-[#E5E0D8] whitespace-pre-wrap font-serif text-lg leading-relaxed text-[#2C3E38]">
              {song.lyrics}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
