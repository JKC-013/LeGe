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
  keys?: string[];
  status: 'pending' | 'approved';
}

interface AppState {
  currentUser: User | null;
  users: User[];
  songs: Song[];
  isInitialized: boolean;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  toggleFavourite: (songId: string) => Promise<void>;
  addSong: (song: Omit<Song, 'id' | 'status'>) => Promise<void>;
  addKeyToSong: (songId: string, key: string) => Promise<void>;
  updateUserRole: (email: string, role: UserRole) => Promise<void>;
  approveSong: (songId: string) => Promise<void>;
  declineSong: (songId: string) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
  fetchSongs: () => Promise<void>;
  fetchUsers: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  songs: [],
  isInitialized: false,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      set({ isInitialized: true });
      return;
    }

    // Listen to auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Fetch user's favourites
        const { data: favs } = await supabase
          .from('favourites')
          .select('song_id')
          .eq('user_id', session.user.id);

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
          
          // Fetch data based on role
          get().fetchSongs();
          if (profile.role === 'admin') {
            get().fetchUsers();
          }
        }
      } else {
        set({ currentUser: null, users: [], songs: [] });
        get().fetchSongs(); // Fetch public approved songs
      }
    });

    // Initial fetch for public songs
    get().fetchSongs();
    set({ isInitialized: true });
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
    
    if (isFav) {
      await supabase
        .from('favourites')
        .delete()
        .match({ user_id: currentUser.id, song_id: songId });
        
      set({
        currentUser: {
          ...currentUser,
          favourites: currentUser.favourites.filter(id => id !== songId)
        }
      });
    } else {
      await supabase
        .from('favourites')
        .insert({ user_id: currentUser.id, song_id: songId });
        
      set({
        currentUser: {
          ...currentUser,
          favourites: [...currentUser.favourites, songId]
        }
      });
    }
  },
  
  addSong: async (songData) => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    
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
        status: 'pending',
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
        status: 'pending',
        created_by: currentUser?.id
      }));
      await supabase.from('song_keys').insert(keysToInsert);
    }

    get().fetchSongs();
  },

  addKeyToSong: async (songId, key) => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    
    await supabase
      .from('song_keys')
      .insert({
        song_id: songId,
        key_name: key,
        status: 'pending',
        created_by: currentUser?.id
      });
      
    get().fetchSongs();
  },
  
  updateUserRole: async (email, role) => {
    if (!isSupabaseConfigured) return;
    
    // We need to find the user ID first
    const userToUpdate = get().users.find(u => u.email === email);
    if (!userToUpdate) return;
    
    await supabase
      .from('users')
      .update({ role })
      .eq('id', userToUpdate.id);
      
    get().fetchUsers();
  },
  
  approveSong: async (songId) => {
    if (!isSupabaseConfigured) return;
    
    await supabase
      .from('songs')
      .update({ status: 'approved' })
      .eq('id', songId);
      
    get().fetchSongs();
  },
  
  declineSong: async (songId) => {
    if (!isSupabaseConfigured) return;
    
    await supabase
      .from('songs')
      .delete()
      .eq('id', songId);
      
    get().fetchSongs();
  },
  
  deleteSong: async (songId) => {
    if (!isSupabaseConfigured) return;
    
    await supabase
      .from('songs')
      .delete()
      .eq('id', songId);
      
    get().fetchSongs();
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
          ? keysData.filter(k => k.song_id === s.id).map(k => k.key_name)
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
  }
}));
