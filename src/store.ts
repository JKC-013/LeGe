import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export type UserRole = 'user' | 'pastor' | 'collaborator' | 'admin' | 'publisher';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  favourites: string[];
}

export interface Song {
  id: string;
  title: string;
  organization: string;
  category: string;
  versions: string[]; // e.g. Mandarin, Cantonese, Vietnamese
  keys: string[];
  pdfUrl: string;
  thumbnailUrl?: string;
  lyrics?: string;
  status: 'pending' | 'approved';
  created_by?: string;
  approval_count: number;
}

export interface ServiceRequest {
  id: string;
  song_ids: string[]; // changed to handle multiple songs
  user_id: string;
  date: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  songs: Song[];
  serviceRequests: ServiceRequest[];
  notifications: Notification[];
  requestQueue: string[];
  isInitialized: boolean;
  
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  toggleFavourite: (songId: string) => Promise<void>;
  addSong: (song: Omit<Song, 'id' | 'status' | 'approval_count'>) => Promise<void>;
  updateUserRole: (email: string, role: UserRole) => Promise<void>;
  approveSong: (songId: string) => Promise<void>;
  declineSong: (songId: string) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
  editSong: (songId: string, updates: Partial<Song>) => Promise<void>;
  addToRequestQueue: (songId: string) => void;
  removeFromRequestQueue: (songId: string) => void;
  submitServiceRequest: (date: string, message: string) => Promise<void>;
  approveServiceRequest: (id: string) => Promise<void>;
  declineServiceRequest: (id: string) => Promise<void>;
  fetchSongs: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  songs: [],
  serviceRequests: [],
  notifications: [],
  requestQueue: [],
  isInitialized: false,
  

  initialize: async () => {
    if (get().isInitialized) return;
    
    if (!isSupabaseConfigured) {
      set({ isInitialized: true });
      return;
    }
    
    const handleSession = async (session: any) => {
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
        }

        const role = profile?.role || (session.user.email === 'khiemvinhtran1112@gmail.com' ? 'admin' : 'user');
        const name = profile?.name || session.user.user_metadata?.name;

        // Fetch user favourites
        const { data: favsData } = await supabase
          .from('favourites')
          .select('song_id')
          .eq('user_id', session.user.id);
        const userFavourites = favsData ? favsData.map(f => f.song_id) : [];

        set({ 
          currentUser: { 
            id: session.user.id, 
            email: session.user.email || '', 
            name,
            role: role, 
            favourites: userFavourites 
          } 
        });
        get().fetchSongs();
        get().fetchNotifications();
        get().fetchUsers();
      } else {
        set({ currentUser: null, users: [], songs: [] });
        get().fetchSongs();
        set({ notifications: [] });
      }
    };

    // Listen to auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      handleSession(session).catch((err) => {
        console.error("Error in onAuthStateChange:", err);
      });
    });

    try {
      // Prevent infinite hang in getSession
      const response = await supabase.auth.getSession();
      const session = response?.data?.session || null;
      await handleSession(session);
    } catch (e) {
      console.error("Error fetching initial session:", e);
    }

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
    const { currentUser, songs } = get();
    if (!currentUser) return;
    
    if (!isSupabaseConfigured) {
      // Use local state if supabase fails (for prototyping)
      const newSong: Song = {
        ...songData,
        id: Date.now().toString(),
        status: 'pending',
        created_by: currentUser.id,
        approval_count: 0
      };
      set({ songs: [...songs, newSong] });
      return;
    }
    
    const dbSong = {
      title: songData.title,
      organization: songData.organization,
      category: songData.category,
      pdf_url: songData.pdfUrl,
      thumbnail_url: songData.thumbnailUrl,
      lyrics: songData.lyrics,
      versions: songData.versions,
      keys: songData.keys,
      status: 'pending',
      created_by: currentUser.id
    };
    
    const { error: insertError } = await supabase.from('songs').insert([dbSong]);
    if (insertError) {
      console.error('7.3. Insert Error:', insertError);
      if (insertError.code === '42703') {
        // Fallback: missing thumbnail_url column
        const { thumbnail_url, ...fallbackSong } = dbSong;
        const { error: fallbackError } = await supabase.from('songs').insert([fallbackSong]);
        if (fallbackError) throw fallbackError;
      } else {
        throw insertError;
      }
    }
    await get().fetchSongs();
    },

  addToRequestQueue: (songId) => {
    const { requestQueue } = get();
    if (!requestQueue.includes(songId)) {
      set({ requestQueue: [...requestQueue, songId] });
    }
  },

  removeFromRequestQueue: (songId) => {
    const { requestQueue } = get();
    set({ requestQueue: requestQueue.filter(id => id !== songId) });
  },

  approveServiceRequest: async (id) => {
    set(state => ({
      serviceRequests: state.serviceRequests.map(req => req.id === id ? { ...req, status: 'approved' } : req)
    }));
  },
  declineServiceRequest: async (id) => {
    set(state => ({
      serviceRequests: state.serviceRequests.map(req => req.id === id ? { ...req, status: 'rejected' } : req)
    }));
  },

  submitServiceRequest: async (date, message) => {
    const { currentUser, serviceRequests, requestQueue } = get();
    if (!currentUser || requestQueue.length === 0) return;
    const newReq: ServiceRequest = {
      id: Date.now().toString(),
      song_ids: [...requestQueue],
      user_id: currentUser.id,
      date,
      message,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    set({ serviceRequests: [...serviceRequests, newReq], requestQueue: [] });
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
      
    const song = get().songs.find(s => s.id === songId);
    if (song && song.created_by) {
      await supabase.from('notifications').insert({
        user_id: song.created_by,
        message: `Your song "${song.title}" has been approved!`,
        type: 'approval',
        read: false
      });
    }
      
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

  editSong: async (songId, updates) => {
    if (!isSupabaseConfigured) {
      // Mock update
      set(state => ({
        songs: state.songs.map(s => s.id === songId ? { ...s, ...updates } : s)
      }));
      return;
    }
    
    // Pass updates directly to Supabase
    const supabaseUpdates: any = { ...updates };
    
    await supabase
      .from('songs')
      .update(supabaseUpdates)
      .eq('id', songId);
    get().fetchSongs();
  },

  
    deleteNotification: async (id) => {
    if (!isSupabaseConfigured) return;
    await supabase.from('notifications').delete().eq('id', id);
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  fetchNotifications: async () => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      set({ notifications: data as Notification[] });
    }
  },

  fetchSongs: async () => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase is not configured yet');
      
      return;
    }
    
    try {
      const { data: songsData, error } = await supabase
        .from('songs')
        .select('*');
        
      if (error) {
        console.error('Error fetching songs:', error);
        
        
      }
        
      if (songsData) {
        console.log('Fetched raw songs:', songsData);
        
        // Filter out known broken records from previous failed tests
        const brokenIds = ['ffa8ee96-7ab8-4eec-b7ec-0e6e53467865', '6f5eb876-9838-40be-a4e6-eff146f677df'];
        const validSongsData = songsData.filter(s => !brokenIds.includes(s.id));
        
        const formattedSongs: Song[] = validSongsData.map(s => ({
          id: s.id,
          title: s.title || 'Untitled',
          organization: s.organization || s.author || '',
          category: s.category || 'Worship',
          pdfUrl: s.pdf_url || '',
          thumbnailUrl: s.thumbnail_url || undefined,
          lyrics: s.lyrics || '',
          status: s.status as 'pending' | 'approved' || 'pending',
          keys: s.keys || [],
          versions: s.versions || [],
          approval_count: s.approval_count || 0
        }));
        console.log('Formatted songs:', formattedSongs);
        set({ songs: formattedSongs });
      }
    } catch (e) {
      console.error('Exception fetching songs:', e);
      
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
        name: u.name,
        role: u.role as UserRole,
        favourites: [] // We don't need to load everyone's favourites for the admin view
      }));
      set({ users: formattedUsers });
    }
  }
}));
