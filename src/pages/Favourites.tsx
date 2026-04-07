import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Music, Star } from 'lucide-react';

export function Favourites() {
  const { t } = useTranslation();
  const { songs, currentUser, toggleFavourite } = useStore();

  if (!currentUser) {
    return <div className="text-center py-12 text-[#8C9A94] text-lg">{t('favourites.login')}</div>;
  }

  const favouriteSongs = songs.filter(s => currentUser.favourites.includes(s.id));

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold text-on-surface">{t('nav.favourites')}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {favouriteSongs.map(song => (
          <div key={song.id} className="group block space-y-4 relative">
            <button 
              onClick={(e) => { e.preventDefault(); toggleFavourite(song.id); }}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-surface/80 backdrop-blur-[24px] text-yellow-500 hover:bg-surface hover:scale-110 transition-all shadow-ambient"
            >
              <Star className="w-5 h-5" fill="currentColor" />
            </button>
            <Link to={`/song/${song.id}`}>
              <div className="aspect-[3/4] bg-surface-container-lowest rounded-2xl overflow-hidden relative shadow-ambient group-hover:-translate-y-1 transition-all duration-300">
                {song.previewUrl ? (
                  <img src={song.previewUrl} alt={song.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-outline-variant">
                    <Music className="w-12 h-12 opacity-20" />
                  </div>
                )}
              </div>
              <div className="space-y-1 px-2 mt-3">
                <h3 className="text-lg font-bold text-on-surface line-clamp-1">{song.title}</h3>
                <div className="flex items-center justify-between text-sm text-on-surface-variant">
                  <span className="truncate pr-2">{song.author}</span>
                  <span className="bg-surface-container px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase shrink-0">{song.category}</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
        {favouriteSongs.length === 0 && (
          <div className="col-span-full text-center py-16 text-on-surface-variant text-lg">
            {t('favourites.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
