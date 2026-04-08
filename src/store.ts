import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export type UserRole = 'user' | 'publisher' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  favourites: string[]; // array of song ids
}

export interface Song {
  id: string;
  title: string;
  author: string;
  category: string;
  audience: 'band' | 'worship';
  pdfUrl: string;
  previewUrl: string;
  lyrics?: string;
  keys?: { id: string; name: string; pdfUrl?: string }[];
  status: 'pending' | 'approved';
  pickCount?: number; // Number of times picked in last 3 months
}

export interface CollectionItem {
  id: string;
  songId: string;
  userId: string;
  createdAt: string;
}

export interface WorshipSubmission {
  id: string;
  userId: string;
  songIds: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approvedAt?: string;
}

export interface SongPick {
  id: string;
  songId: string;
  pickedAt: string;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  songs: Song[];
  userCollection: CollectionItem[]; // User's personal song collection
  worshipSubmissions: WorshipSubmission[]; // All worship submissions for admin view
  isInitialized: boolean;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  toggleFavourite: (songId: string) => Promise<void>;
  addSong: (song: Omit<Song, 'id' | 'status'>) => Promise<void>;
  addKeyToSong: (songId: string, keyName: string, pdfUrl?: string) => Promise<void>;
  removeKey: (keyId: string) => Promise<void>;
  updateUserRole: (email: string, role: UserRole) => Promise<void>;
  approveSong: (songId: string) => Promise<void>;
  declineSong: (songId: string) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
  updateSong: (songId: string, updates: Partial<Omit<Song, 'id'>>) => Promise<void>;
  updateKeyPdf: (keyId: string, pdfUrl: string) => Promise<void>;
  fetchSongs: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  // Collection methods
  addToCollection: (songId: string) => Promise<void>;
  removeFromCollection: (songId: string) => Promise<void>;
  fetchUserCollection: () => Promise<void>;
  submitToWorship: (songIds: string[]) => Promise<void>;
  fetchWorshipSubmissions: () => Promise<void>;
  approveWorshipSubmission: (submissionId: string) => Promise<void>;
  declineWorshipSubmission: (submissionId: string) => Promise<void>;
  getPickCount: (songId: string) => number;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  songs: [],
  userCollection: [],
  worshipSubmissions: [],
  isInitialized: false,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      set({ isInitialized: true });
      return;
    }

    const loadProfileState = async (sessionUser: any) => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (profileError) {
          console.error('[CRITICAL] Error fetching profile:', profileError);
        }

        const { data: favs, error: favError } = await supabase
          .from('favourites')
          .select('song_id')
          .eq('user_id', sessionUser.id);
          
        if (favError) console.error('Error fetching favourites:', favError);

        const favourites = favs ? favs.map(f => f.song_id) : [];

        if (profile) {
          set({ 
            currentUser: { 
              id: profile.id, 
              email: profile.email, 
              role: profile.role, 
              favourites 
            } 
          });
          
          get().fetchSongs();
          get().fetchUserCollection();
          if (profile.role === 'admin') {
            get().fetchUsers();
            get().fetchWorshipSubmissions();
          }
        } else {
          console.error("Profile not found for session user ID:", sessionUser.id);
        }
      } catch (err) {
        console.error("Unhandled error in loadProfileState:", err);
      }
    };

    // Await initial session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadProfileState(session.user);
    } else {
      get().fetchSongs();
    }
    set({ isInitialized: true });

    // Listen to auth changes
    supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (authSession?.user) {
        await loadProfileState(authSession.user);
      } else {
        set({ currentUser: null, users: [], songs: [] });
        get().fetchSongs();
      }
    });
  },
  
  logout: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    set({ currentUser: null });
  },
  
  toggleFavourite: async (songId) => {
    const { currentUser } = get();
    if (!currentUser || !isSupabaseConfigured) return;

    const isFav = currentUser.favourites.includes(songId);
    
    try {
      if (isFav) {
        const { error } = await supabase
          .from('favourites')
          .delete()
          .match({ user_id: currentUser.id, song_id: songId });
          
        if (error) throw error;
          
        set({
          currentUser: {
            ...currentUser,
            favourites: currentUser.favourites.filter(id => id !== songId)
          }
        });
      } else {
        const { error } = await supabase
          .from('favourites')
          .insert({ user_id: currentUser.id, song_id: songId });
          
        if (error) throw error;
          
        set({
          currentUser: {
            ...currentUser,
            favourites: [...currentUser.favourites, songId]
          }
        });
      }
    } catch (err: any) {
      console.error('[CRITICAL] Error toggling favourite:', err);
      alert(`Could not update favourite: ${err.message || 'Unknown error'}`);
    }
  },
  
  addSong: async (songData) => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    
    const publishStatus = currentUser?.role === 'admin' ? 'approved' : 'pending';
    
    try {
      const { data, error } = await supabase
        .from('songs')
        .insert({
          title: songData.title,
          author: songData.author,
          category: songData.category,
          audience: songData.audience,
          pdf_url: songData.pdfUrl,
          preview_url: songData.previewUrl,
          lyrics: songData.lyrics,
          status: publishStatus,
          created_by: currentUser?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add keys if any
      if (songData.keys && songData.keys.length > 0 && data) {
        const keysToInsert = songData.keys.map(k => ({
          song_id: data.id,
          key_name: k,
          status: publishStatus,
          created_by: currentUser?.id
        }));
        const { error: keyError } = await supabase.from('song_keys').insert(keysToInsert);
        if (keyError) throw keyError;
      }

      await get().fetchSongs();
    } catch (err: any) {
      console.error('[CRITICAL] Error adding song:', err);
      // Re-throw so caller (PublisherDashboard) can handle showing the error in UI if needed
      throw err;
    }
  },

  addKeyToSong: async (songId, keyName, pdfUrl) => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    
    const publishStatus = currentUser?.role === 'admin' ? 'approved' : 'pending';
    
    try {
      const { error } = await supabase
        .from('song_keys')
        .insert({
          song_id: songId,
          key_name: keyName,
          pdf_url: pdfUrl,
          status: publishStatus,
          created_by: currentUser?.id
        });
        
      if (error) throw error;
      await get().fetchSongs();
    } catch (err: any) {
      console.error('[CRITICAL] Error adding key:', err);
      alert(`Could not add key: ${err.message || 'Unknown error'}`);
      throw err;
    }
  },

  removeKey: async (keyId) => {
    if (!isSupabaseConfigured) return;
    
    try {
      // Find key location to delete PDF if exists
      const songWithKey = get().songs.find(s => s.keys?.some(k => k.id === keyId));
      const key = songWithKey?.keys?.find(k => k.id === keyId);
      
      if (key?.pdfUrl) {
        const path = key.pdfUrl.split('/public/music-sheets/').pop();
        if (path) {
          await supabase.storage.from('music-sheets').remove([path]);
        }
      }

      const { error } = await supabase
        .from('song_keys')
        .delete()
        .eq('id', keyId);
        
      if (error) throw error;
      await get().fetchSongs();
    } catch (err: any) {
      console.error('[CRITICAL] Error removing key:', err);
      alert(`Could not remove key: ${err.message || 'Unknown error'}`);
    }
  },
  
  updateUserRole: async (email, role) => {
    if (!isSupabaseConfigured) return;
    
    try {
      const userToUpdate = get().users.find(u => u.email === email);
      if (!userToUpdate) return;
      
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userToUpdate.id);
        
      if (error) throw error;
      await get().fetchUsers();
    } catch (err: any) {
      console.error('[CRITICAL] Error updating user role:', err);
      alert(`Could not update user role: ${err.message || 'Unknown error'}`);
    }
  },
  
  approveSong: async (songId) => {
    if (!isSupabaseConfigured) return;
    
    try {
      const { error } = await supabase
        .from('songs')
        .update({ status: 'approved' })
        .eq('id', songId);
        
      if (error) throw error;
      await get().fetchSongs();
    } catch (err: any) {
      console.error('[CRITICAL] Error approving song:', err);
      alert(`Could not approve song: ${err.message || 'Unknown error'}`);
    }
  },
  
  declineSong: async (songId) => {
    if (!isSupabaseConfigured) return;
    
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);
        
      if (error) throw error;
      await get().fetchSongs();
    } catch (err: any) {
      console.error('[CRITICAL] Error declining song:', err);
      alert(`Could not decline song: ${err.message || 'Unknown error'}`);
    }
  },
  
  deleteSong: async (songId) => {
    if (!isSupabaseConfigured) return;
    
    // Best-effort storage cleanup — never blocks the DB delete
    try {
      const song = get().songs.find(s => s.id === songId);
      if (song) {
        const pathsToDelete: string[] = [];

        // Main PDF
        if (song.pdfUrl) {
          const p = song.pdfUrl.split('/public/music-sheets/').pop();
          if (p) pathsToDelete.push(p);
        }
        // Thumbnail
        if (song.previewUrl) {
          const p = song.previewUrl.split('/public/music-sheets/').pop();
          if (p) pathsToDelete.push(p);
        }
        // Key PDFs
        if (song.keys) {
          for (const k of song.keys) {
            if (k.pdfUrl) {
              const p = k.pdfUrl.split('/public/music-sheets/').pop();
              if (p) pathsToDelete.push(p);
            }
          }
        }

        if (pathsToDelete.length > 0) {
          await supabase.storage.from('music-sheets').remove(pathsToDelete);
        }
      }
    } catch (storageErr) {
      // Storage cleanup failed — log it but continue to delete the DB record
      console.warn('[WARN] Storage cleanup error (non-fatal):', storageErr);
    }

    // Always attempt to delete the DB record
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);
        
      if (error) throw error;
      
      await get().fetchSongs();
    } catch (err: any) {
      console.error('[CRITICAL] Error deleting song:', err);
      alert(`Could not delete song: ${err.message || 'Unknown error'}`);
    }
  },

  updateSong: async (songId, updates) => {
    if (!isSupabaseConfigured) return;
    
    try {
      const song = get().songs.find(s => s.id === songId);
      const dbUpdates: any = { ...updates };
      
      if (updates.pdfUrl !== undefined) { 
        dbUpdates.pdf_url = updates.pdfUrl; 
        delete dbUpdates.pdfUrl; 
        // Cleanup old PDF
        if (song?.pdfUrl && song.pdfUrl !== updates.pdfUrl) {
          const oldPath = song.pdfUrl.split('/public/music-sheets/').pop();
          if (oldPath) await supabase.storage.from('music-sheets').remove([oldPath]);
        }
      }
      
      if (updates.previewUrl !== undefined) { 
        dbUpdates.preview_url = updates.previewUrl; 
        delete dbUpdates.previewUrl; 
        // Cleanup old thumbnail
        if (song?.previewUrl && song.previewUrl !== updates.previewUrl) {
          const oldThumbPath = song.previewUrl.split('/public/music-sheets/').pop();
          if (oldThumbPath) await supabase.storage.from('music-sheets').remove([oldThumbPath]);
        }
      }
      
      const { error } = await supabase
        .from('songs')
        .update(dbUpdates)
        .eq('id', songId);
        
      if (error) throw error;
      await get().fetchSongs();
    } catch (err: any) {
      console.error('[CRITICAL] Error updating song:', err);
      throw err; 
    }
  },

  updateKeyPdf: async (keyId, pdfUrl) => {
    if (!isSupabaseConfigured) return;
    
    try {
      const songWithKey = get().songs.find(s => s.keys?.some(k => k.id === keyId));
      const key = songWithKey?.keys?.find(k => k.id === keyId);

      // Cleanup old PDF if it's being replaced
      if (key?.pdfUrl && key.pdfUrl !== pdfUrl) {
        const oldPath = key.pdfUrl.split('/public/music-sheets/').pop();
        if (oldPath) await supabase.storage.from('music-sheets').remove([oldPath]);
      }

      const { error } = await supabase
        .from('song_keys')
        .update({ pdf_url: pdfUrl })
        .eq('id', keyId);
        
      if (error) throw error;
      await get().fetchSongs();
    } catch (err: any) {
      console.error('[CRITICAL] Error updating key PDF:', err);
      throw err;
    }
  },

  fetchSongs: async () => {
    if (!isSupabaseConfigured) return;
    
    const { data: songsData } = await supabase
      .from('songs')
      .select('*');
      
    const { data: keysData } = await supabase
      .from('song_keys')
      .select('*');
      
    if (songsData) {
      const formattedSongs: Song[] = songsData.map(s => {
        const songKeys = keysData 
          ? keysData.filter(k => k.song_id === s.id).map(k => ({
              id: k.id,
              name: k.key_name,
              pdfUrl: k.pdf_url
            }))
          : [];
          
        return {
          id: s.id,
          title: s.title,
          author: s.author,
          category: s.category,
          audience: s.audience as 'band' | 'worship',
          pdfUrl: s.pdf_url,
          previewUrl: s.preview_url,
          lyrics: s.lyrics,
          status: s.status as 'pending' | 'approved',
          keys: songKeys
        };
      });
      set({ songs: formattedSongs });
    }
  },

  fetchUsers: async () => {
    if (!isSupabaseConfigured) return;
    
    const { data } = await supabase
      .from('users')
      .select('*');
      
    if (data) {
      const formattedUsers: User[] = data.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role as UserRole,
        favourites: [] // We don't need to load everyone's favourites for the admin view
      }));
      set({ users: formattedUsers });
    }
  },

  // Collection methods
  addToCollection: async (songId: string) => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('collections')
        .insert({
          user_id: currentUser.id,
          song_id: songId
        });

      if (error) throw error;
      await get().fetchUserCollection();
    } catch (err: any) {
      console.error('[CRITICAL] Error adding to collection:', err);
      alert(`Could not add to collection: ${err.message || 'Unknown error'}`);
    }
  },

  removeFromCollection: async (songId: string) => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .match({ user_id: currentUser.id, song_id: songId });

      if (error) throw error;
      await get().fetchUserCollection();
    } catch (err: any) {
      console.error('[CRITICAL] Error removing from collection:', err);
      alert(`Could not remove from collection: ${err.message || 'Unknown error'}`);
    }
  },

  fetchUserCollection: async () => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', currentUser.id);

      if (data) {
        set({ userCollection: data });
      }
    } catch (err: any) {
      console.error('[CRITICAL] Error fetching collection:', err);
    }
  },

  submitToWorship: async (songIds: string[]) => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      // Create a single worship submission with all songs
      const { error } = await supabase
        .from('worship_collections')
        .insert(
          songIds.map(songId => ({
            user_id: currentUser.id,
            song_id: songId,
            status: 'pending'
          }))
        );

      if (error) throw error;
      await get().fetchWorshipSubmissions();
    } catch (err: any) {
      console.error('[CRITICAL] Error submitting to worship:', err);
      alert(`Could not submit: ${err.message || 'Unknown error'}`);
    }
  },

  fetchWorshipSubmissions: async () => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();

    try {
      let query = supabase
        .from('worship_collections')
        .select('*');

      // Admins see all submissions, users see their own
      if (currentUser?.role !== 'admin') {
        query = query.eq('user_id', currentUser?.id || '');
      }

      const { data } = await query;

      if (data) {
        // Group by submission time and status
        set({ worshipSubmissions: data as any });
      }
    } catch (err: any) {
      console.error('[CRITICAL] Error fetching worship submissions:', err);
    }
  },

  approveWorshipSubmission: async (submissionId: string) => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('worship_collections')
        .update({
          status: 'approved',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      // Track the pick
      const submission = get().worshipSubmissions.find(s => s.id === submissionId);
      if (submission?.songIds) {
        for (const songId of submission.songIds) {
          await supabase
            .from('song_picks')
            .insert({
              song_id: songId,
              approved_by: currentUser.id,
              picked_at: new Date().toISOString()
            });
        }
      }

      await get().fetchWorshipSubmissions();
      await get().fetchSongs();
    } catch (err: any) {
      console.error('[CRITICAL] Error approving worship submission:', err);
      alert(`Could not approve: ${err.message || 'Unknown error'}`);
    }
  },

  declineWorshipSubmission: async (submissionId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('worship_collections')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      if (error) throw error;
      await get().fetchWorshipSubmissions();
    } catch (err: any) {
      console.error('[CRITICAL] Error declining worship submission:', err);
      alert(`Could not decline: ${err.message || 'Unknown error'}`);
    }
  },

  getPickCount: (songId: string) => {
    if (!isSupabaseConfigured) return 0;
    
    // This would require an additional query to get pick counts
    // For now, returning the pick count from song data
    const song = get().songs.find(s => s.id === songId);
    return song?.pickCount || 0;
  }
}));
