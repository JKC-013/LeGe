import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, Music, Star, Mic, Grid, List, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useStore } from '../store';

export function SongsCatalog() {
  const { t } = useTranslation();
  const { songs, currentUser, toggleFavourite, addToRequestQueue, removeFromRequestQueue, requestQueue } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  
  const approvedSongs = songs.filter(song => song.status === 'approved');
  
  const categories = ['All', ...Array.from(new Set(approvedSongs.map(s => s.category)))];

  const filteredSongs = approvedSongs.filter(song => 
    (categoryFilter === 'All' || song.category === categoryFilter) &&
    (song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     song.organization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredSongs.length / ITEMS_PER_PAGE);
  const paginatedSongs = filteredSongs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-on-surface">
          {t('home.allSongs') || "All Songs"}
        </h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-outline-variant" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-outline-variant/30 rounded-xl bg-surface-container-highest text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder={t('home.searchPlaceholder') || "Search..."}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          <div className="relative">
            <select 
              className="w-full sm:w-auto pl-4 pr-10 py-2 border border-outline-variant/30 rounded-xl bg-surface shadow-sm text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer hover:bg-surface-container-lowest transition-all text-on-surface font-medium"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? t('home.all') : cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          </div>
          
          <div className="flex items-center bg-surface-container rounded-xl p-1 shrink-0">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredSongs.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant text-lg bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-ambient">
          {t('home.empty') || "No songs found."}
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            : "flex flex-col space-y-4"
          }>
            {paginatedSongs.map(song => {
              const isFav = currentUser?.favourites.includes(song.id);
              const inQueue = requestQueue.includes(song.id);

              return viewMode === 'grid' ? (
                <div key={song.id} className="group block space-y-3 bg-surface-container-lowest p-4 rounded-2xl shadow-ambient hover:shadow-lg transition-all relative border border-outline-variant/10">
                  <div className="absolute top-6 right-6 flex space-x-2 z-10">
                    {currentUser && (
                      <button 
                        onClick={(e) => { e.preventDefault(); toggleFavourite(song.id); }}
                        className={`p-2 rounded-full backdrop-blur-md transition-colors ${isFav ? 'bg-primary text-on-primary' : 'bg-surface/50 text-on-surface-variant hover:bg-surface hover:text-primary'}`}
                      >
                        <Star className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    )}
                    {currentUser && (
                      <button 
                        onClick={(e) => { e.preventDefault(); inQueue ? removeFromRequestQueue(song.id) : addToRequestQueue(song.id); }}
                        className={`p-2 rounded-full backdrop-blur-md transition-colors ${inQueue ? 'bg-primary text-on-primary' : 'bg-surface/50 text-on-surface-variant hover:bg-surface hover:text-primary'}`}
                      >
                        <Mic className="w-4 h-4" fill={inQueue ? "currentColor" : "none"} />
                      </button>
                    )}
                  </div>
                  <Link to={`/song/${song.id}`}>
                    <div className="aspect-[3/4] bg-surface-container rounded-xl overflow-hidden relative flex items-center justify-center group-hover:scale-[1.02] transition-transform">
                      {song.thumbnailUrl ? (
                        <img src={song.thumbnailUrl} alt={song.title} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-10 h-10 text-outline-variant opacity-30" />
                      )}
                    </div>
                    <div className="pt-3 space-y-1">
                      <h3 className="text-base font-bold text-on-surface truncate group-hover:text-primary transition-colors" title={song.title}>
                        {song.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-on-surface-variant">
                        <span className="truncate pr-2">{song.organization}</span>
                        <span className="bg-surface-container px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                          {song.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ) : (
                <div key={song.id} className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-xl shadow-ambient hover:shadow-md transition-all border border-outline-variant/10">
                  <Link to={`/song/${song.id}`} className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-surface-container rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      {song.thumbnailUrl ? (
                        <img src={song.thumbnailUrl} alt={song.title} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-outline-variant opacity-50" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface hover:text-primary transition-colors">{song.title}</h3>
                      <p className="text-sm text-on-surface-variant">{song.organization} • {song.category}</p>
                    </div>
                  </Link>
                  
                  <div className="flex items-center space-x-2 shrink-0">
                    {currentUser && (
                      <>
                        <button 
                          onClick={() => inQueue ? removeFromRequestQueue(song.id) : addToRequestQueue(song.id)}
                          className={`p-2.5 rounded-full transition-colors ${inQueue ? 'text-primary' : 'text-on-surface-variant hover:bg-surface hover:text-primary'}`}
                        >
                          <Mic className="w-5 h-5" fill={inQueue ? "currentColor" : "none"} />
                        </button>
                        <button 
                          onClick={() => toggleFavourite(song.id)}
                          className={`p-2.5 rounded-full transition-colors ${isFav ? 'text-primary' : 'text-on-surface-variant hover:bg-surface hover:text-primary'}`}
                        >
                          <Star className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 pt-8">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full border border-outline-variant/30 hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed text-on-surface"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-on-surface">
                {t('home.page', { current: currentPage, total: totalPages })}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full border border-outline-variant/30 hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed text-on-surface"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
