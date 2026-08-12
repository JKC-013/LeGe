import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Music, Mic } from 'lucide-react';
import { useStore } from '../store';
import { isSupabaseConfigured } from '../lib/supabase';

export function Home() {
  const { t } = useTranslation();
  const { songs, currentUser, serviceRequests } = useStore();

  const approvedSongs = songs.filter(song => song.status === 'approved');
  
  // Selected songs: songs that have been approved by pastor
  const approvedRequests = serviceRequests.filter(req => req.status === 'approved');
  const selectedSongIds = new Set(approvedRequests.flatMap(req => req.song_ids));
  const topSongs = songs.filter(song => selectedSongIds.has(song.id));

  const previewSongs = approvedSongs.slice(0, 8);

  return (
    <div className="space-y-20">

      {/* Welcome Banner for Logged In User */}
      {currentUser && (
        <section className="bg-primary/10 rounded-2xl p-6 border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-ambient">
          <div>
            <h1 className="text-2xl font-display font-bold text-on-surface">
              {t('home.welcomeBack', { name: currentUser.name || currentUser.email })}
            </h1>
            <p className="text-on-surface-variant mt-1 text-sm">
              <span>{t("home.signedInAs", { role: currentUser.role })}</span>
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
            {currentUser.role === 'admin' && (
              <Link to="/admin" className="inline-block px-6 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-container text-sm font-bold shadow-ambient transition-colors whitespace-nowrap">
                {t('home.goToAdminHub')}
              </Link>
            )}
            {(currentUser.role === 'publisher' || currentUser.role === 'collaborator' || currentUser.role === 'admin') && (
              <Link to="/publisher" className="inline-block px-6 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-container text-sm font-bold shadow-ambient transition-colors whitespace-nowrap">
                {t('home.goToPublisherDashboard')}
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Selected Songs Section */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-on-surface">
              {t('home.selectedSongs') || "Selected songs in this month"}
            </h2>
          </div>
        </div>
        
        {topSongs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topSongs.map(song => (
              <SongCard key={song.id} song={song} showApprovalCount />
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest p-12 rounded-3xl text-center shadow-ambient border border-outline-variant/20">
            <p className="text-xl font-medium text-on-surface-variant">
              {t('home.emptySelection') || "Remember to send your chosen songs to the pastor!"}
            </p>
          </div>
        )}
      </section>

      {/* All Songs Preview Section */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-on-surface">
            {t('home.allSongs') || "Songs"}
          </h2>
          <Link 
            to="/songs" 
            className="group flex items-center text-sm font-bold text-primary hover:text-primary-container transition-colors"
          >
            {t('home.all')} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {previewSongs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {previewSongs.map(song => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-on-surface-variant">{t('home.noSongs')}</div>
        )}
      </section>
      
    </div>
  );
}

function SongCard({ song, showApprovalCount = false }: { song: any; showApprovalCount?: boolean; key?: React.Key }) {
  const { t } = useTranslation();
  const { currentUser, toggleFavourite, addToRequestQueue, removeFromRequestQueue, requestQueue } = useStore();
  const isFav = currentUser?.favourites.includes(song.id);
  const inQueue = requestQueue.includes(song.id);

  return (
    <div className="group block space-y-4 bg-surface-container-lowest p-4 rounded-2xl shadow-ambient hover:shadow-lg transition-all relative border border-outline-variant/10">
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
          {showApprovalCount && song.approval_count > 0 && (
            <div className="mt-2 text-xs font-medium text-primary">
              {t('home.approvedTimes', { count: song.approval_count })}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
