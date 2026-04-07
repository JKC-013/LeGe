import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, Music, Mic2 } from 'lucide-react';
import { useStore } from '../store';

export function Home() {
  const { t } = useTranslation();
  const { songs } = useStore();
  const [activeTab, setActiveTab] = useState<'band' | 'worship'>('band');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSongs = songs.filter(song => 
    song.status === 'approved' &&
    song.audience === activeTab &&
    (song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     song.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-16">
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-on-surface tracking-tight">
          {t('home.title')}
        </h1>
        <p className="text-lg sm:text-xl text-on-surface-variant font-medium">
          {t('home.subtitle')}
        </p>
      </div>

      <div className="max-w-2xl mx-auto relative rounded-t-xl rounded-b-sm bg-surface-container-highest">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-outline-variant" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-4 border-b-2 border-transparent bg-transparent leading-5 text-on-surface placeholder-on-surface-variant/70 focus:outline-none focus:border-primary sm:text-base transition-colors rounded-t-xl rounded-b-sm"
          placeholder={t('home.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex justify-center">
        <div className="inline-flex bg-surface-container p-1 rounded-full">
          <button
            className={`px-8 py-3 text-sm font-medium rounded-full transition-all flex items-center space-x-2 ${
              activeTab === 'band'
                ? 'bg-primary text-on-primary shadow-ambient'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
            onClick={() => setActiveTab('band')}
          >
            <Music className="w-4 h-4" />
            <span>{t('home.tab.band')}</span>
          </button>
          <button
            className={`px-8 py-3 text-sm font-medium rounded-full transition-all flex items-center space-x-2 ${
              activeTab === 'worship'
                ? 'bg-primary text-on-primary shadow-ambient'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
            onClick={() => setActiveTab('worship')}
          >
            <Mic2 className="w-4 h-4" />
            <span>{t('home.tab.worship')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredSongs.map(song => (
          <Link key={song.id} to={`/song/${song.id}`} className="group block space-y-4">
            <div className="aspect-[3/4] bg-surface-container-lowest rounded-2xl overflow-hidden relative shadow-ambient group-hover:-translate-y-1 transition-all duration-300">
              {song.previewUrl ? (
                <img src={song.previewUrl} alt={song.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-outline-variant">
                  <Music className="w-12 h-12 opacity-20" />
                </div>
              )}
            </div>
            <div className="space-y-1 px-2">
              <h3 className="text-lg font-bold text-on-surface line-clamp-1">{song.title}</h3>
              <div className="flex items-center justify-between text-sm text-on-surface-variant">
                <span className="truncate pr-2">{song.author}</span>
                <span className="bg-surface-container px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase shrink-0">{song.category}</span>
              </div>
            </div>
          </Link>
        ))}
        {filteredSongs.length === 0 && (
          <div className="col-span-full text-center py-16 text-on-surface-variant text-lg">
            {t('home.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
