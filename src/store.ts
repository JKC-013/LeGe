import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const isMissingTableError = (error: any, tableName: string) => {
  const message = error?.message || '';
  return typeof message === 'string' && (
    message.includes(`Could not find the table 'public.${tableName}'`) ||
    message.includes(`relation \"${tableName}\" does not exist`)
  );
};

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

export interface WorshipSubmission {
  id: string;
  userId: string;
  songIds: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approvedAt?: string;
  message?: string;
}

export interface SongPick {
  id: string;
  songId: string;
  pickedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  songs: Song[];
  cartItems: string[]; // Array of song IDs in ephemeral cart (in-memory only)
  worshipSubmissions: WorshipSubmission[]; // All worship submissions for admin view
  notifications: Notification[];
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
  // Cart methods (ephemeral shopping cart)
  addToCart: (songId: string) => void;
  removeFromCart: (songId: string) => void;
  clearCart: () => void;
  isInCart: (songId: string) => boolean;
  // Worship submission methods (cart functionality)
  submitToWorship: (songIds: string[], message?: string) => Promise<void>;
  fetchWorshipSubmissions: () => Promise<void>;
  approveWorshipSubmission: (submissionId: string) => Promise<void>;
  declineWorshipSubmission: (submissionId: string) => Promise<void>;
  deleteWorshipSubmission: (submissionId: string) => Promise<void>;
  getPickCount: (songId: string) => number;
  // Notification methods
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  // Notification count methods
  getPendingPublisherCount: () => number;
  getPendingWorshipCount: () => number;
  getPendingAccessCount: () => number;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  songs: [],
  cartItems: [],
  worshipSubmissions: [],
  notifications: [],
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
          get().fetchNotifications();
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

  submitToWorship: async (songIds: string[], message?: string) => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      // Step 1: Create worship_submission batch record
      const { data: submissionData, error: submissionError } = await supabase
        .from('worship_submissions')
        .insert({
          user_id: currentUser.id,
          status: 'pending',
          message: message || null,
          submitted_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (submissionError) {
        if (isMissingTableError(submissionError, 'worship_submissions')) {
          const { error: fallbackError } = await supabase
            .from('worship_collections')
            .insert(
              songIds.map(songId => ({
                user_id: currentUser.id,
                song_id: songId,
                status: 'pending',
                submitted_at: new Date().toISOString()
              }))
            );

          if (fallbackError) throw fallbackError;
          await get().fetchWorshipSubmissions();
          return;
        }

        throw submissionError;
      }

      if (!submissionData) throw new Error('Failed to create submission');

      // Step 2: Insert songs linked to submission
      const { error: songsError } = await supabase
        .from('worship_collections')
        .insert(
          songIds.map(songId => ({
            user_id: currentUser.id,
            song_id: songId,
            status: 'pending',
            submission_id: submissionData.id
          }))
        );

      if (songsError) throw songsError;
      await get().fetchWorshipSubmissions();
    } catch (err: any) {
      console.error('[CRITICAL] Error submitting to worship:', err);
      throw err;
    }
  },

  fetchWorshipSubmissions: async () => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();

    try {
      // Fetch worship_submissions
      let submissionsQuery = supabase
        .from('worship_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      // Admins see only pending requests; users see their own records
      if (currentUser?.role === 'admin') {
        submissionsQuery = submissionsQuery.eq('status', 'pending');
      } else {
        submissionsQuery = submissionsQuery.eq('user_id', currentUser?.id || '');
      }

      const { data: submissions, error: submissionsError } = await submissionsQuery;

      if (submissionsError) {
        if (isMissingTableError(submissionsError, 'worship_submissions')) {
          let collectionQuery = supabase
            .from('worship_collections')
            .select('id,user_id,song_id,status,submitted_at,approved_at')
            .order('submitted_at', { ascending: false });

          if (currentUser?.role === 'admin') {
            collectionQuery = collectionQuery.eq('status', 'pending');
          } else {
            collectionQuery = collectionQuery.eq('user_id', currentUser?.id || '');
          }

          const { data: collectionRows, error: collectionError } = await collectionQuery;

          if (collectionError) throw collectionError;

          const fallbackSubmissions: WorshipSubmission[] = (collectionRows || []).map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            songIds: [row.song_id],
            status: row.status,
            submittedAt: row.submitted_at,
            approvedAt: row.approved_at,
            message: undefined
          }));

          set({ worshipSubmissions: fallbackSubmissions });
          return;
        }

        throw submissionsError;
      }

      if (submissions && submissions.length > 0) {
        // For each submission, fetch its songs
        const submissionsWithSongs: WorshipSubmission[] = await Promise.all(
          submissions.map(async (sub: any) => {
            const { data: songRows } = await supabase
              .from('worship_collections')
              .select('song_id')
              .eq('submission_id', sub.id);

            return {
              id: sub.id,
              userId: sub.user_id,
              songIds: songRows?.map((r: any) => r.song_id) || [],
              status: sub.status,
              submittedAt: sub.submitted_at,
              approvedAt: sub.approved_at,
              message: sub.message
            };
          })
        );

        set({ worshipSubmissions: submissionsWithSongs });
      } else {
        set({ worshipSubmissions: [] });
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
      const approvedAt = new Date().toISOString();

      let submissionUserId: string | null = null;
      let submissionMessage: string | null = null;
      let songIds: string[] = [];
      let isCollectionFallback = false;

      const { data: submissionData, error: fetchError } = await supabase
        .from('worship_submissions')
        .select('user_id, message')
        .eq('id', submissionId)
        .single();

      if (!fetchError && submissionData) {
        submissionUserId = submissionData.user_id;
        submissionMessage = submissionData.message;

        const { data: collectionRows, error: collectionFetchError } = await supabase
          .from('worship_collections')
          .select('song_id')
          .eq('submission_id', submissionId);

        if (!collectionFetchError && collectionRows) {
          songIds = collectionRows.map((row: any) => row.song_id);
        }

        const { error: submissionUpdateError } = await supabase
          .from('worship_submissions')
          .update({
            status: 'approved',
            approved_by: currentUser.id,
            approved_at: approvedAt
          })
          .eq('id', submissionId);

        if (submissionUpdateError) throw submissionUpdateError;

        const { error: collectionUpdateError } = await supabase
          .from('worship_collections')
          .update({
            status: 'approved',
            approved_by: currentUser.id,
            approved_at: approvedAt
          })
          .eq('submission_id', submissionId);

        if (collectionUpdateError) throw collectionUpdateError;
      } else if (fetchError && isMissingTableError(fetchError, 'worship_submissions')) {
        isCollectionFallback = true;
      } else if (!submissionData) {
        isCollectionFallback = true;
      }

      if (isCollectionFallback) {
        const { data: songRow, error: songRowError } = await supabase
          .from('worship_collections')
          .select('song_id, user_id')
          .eq('id', submissionId)
          .single();

        if (songRowError) throw songRowError;

        submissionUserId = songRow?.user_id || submissionUserId;
        if (songRow?.song_id) {
          songIds = [songRow.song_id];
        }

        const { error: collectionUpdateError } = await supabase
          .from('worship_collections')
          .update({
            status: 'approved',
            approved_by: currentUser.id,
            approved_at: approvedAt
          })
          .eq('id', submissionId);

        if (collectionUpdateError) throw collectionUpdateError;
      }

      if (songIds.length > 0) {
        for (const songId of songIds) {
          const { error: pickError } = await supabase
            .from('song_picks')
            .insert({
              song_id: songId,
              approved_by: currentUser.id,
              picked_at: approvedAt
            });

          if (pickError) throw pickError;
        }
      }

      if (submissionUserId) {
        const songTitles = songIds.map(id => get().songs.find(s => s.id === id)?.title).filter(Boolean);
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: submissionUserId,
            type: 'worship_approved',
            title: 'Worship Submission Approved',
            message: songTitles.length > 0
              ? `Your submission for "${songTitles.join(', ')}" has been approved and added to the worship list.`
              : submissionMessage || 'Your worship submission has been approved and added to the worship list.',
            data: { submissionId, songIds, status: 'approved' },
            read: false
          });

        if (notificationError) {
          if (isMissingTableError(notificationError, 'notifications')) {
            console.error('[CRITICAL] Notifications table missing. Approval notification could not be saved.');
          } else {
            console.warn('[WARN] Could not insert approval notification:', notificationError);
          }
        }
      }

      set(state => ({
        worshipSubmissions: state.worshipSubmissions.filter(s => s.id !== submissionId)
      }));

      await get().fetchWorshipSubmissions();
      await get().fetchSongs();
    } catch (err: any) {
      console.error('[CRITICAL] Error approving worship submission:', err);
      alert(`Could not approve: ${err.message || 'Unknown error'}`);
    }
  },

  declineWorshipSubmission: async (submissionId: string) => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const declinedAt = new Date().toISOString();
      let submissionUserId: string | null = null;
      let submissionMessage: string | null = null;
      let songIds: string[] = [];
      let isCollectionFallback = false;

      const { data: submissionData, error: fetchError } = await supabase
        .from('worship_submissions')
        .select('user_id, message')
        .eq('id', submissionId)
        .single();

      if (!fetchError && submissionData) {
        submissionUserId = submissionData.user_id;
        submissionMessage = submissionData.message;

        const { data: collectionRows, error: collectionFetchError } = await supabase
          .from('worship_collections')
          .select('song_id')
          .eq('submission_id', submissionId);

        if (!collectionFetchError && collectionRows) {
          songIds = collectionRows.map((row: any) => row.song_id);
        }

        const { error: submissionUpdateError } = await supabase
          .from('worship_submissions')
          .update({
            status: 'rejected',
            approved_by: currentUser.id,
            approved_at: declinedAt
          })
          .eq('id', submissionId);

        if (submissionUpdateError) throw submissionUpdateError;

        const { error: collectionUpdateError } = await supabase
          .from('worship_collections')
          .update({
            status: 'rejected',
            approved_by: currentUser.id,
            approved_at: declinedAt
          })
          .eq('submission_id', submissionId);

        if (collectionUpdateError) throw collectionUpdateError;
      } else if (fetchError && isMissingTableError(fetchError, 'worship_submissions')) {
        isCollectionFallback = true;
      } else if (!submissionData) {
        isCollectionFallback = true;
      }

      if (isCollectionFallback) {
        const { data: collectionData, error: collectionFetchError } = await supabase
          .from('worship_collections')
          .select('song_id, user_id')
          .eq('id', submissionId)
          .single();

        if (collectionFetchError) throw collectionFetchError;

        submissionUserId = collectionData?.user_id || submissionUserId;
        if (collectionData?.song_id) {
          songIds = [collectionData.song_id];
        }

        const { error: collectionUpdateError } = await supabase
          .from('worship_collections')
          .update({
            status: 'rejected',
            approved_by: currentUser.id,
            approved_at: declinedAt
          })
          .eq('id', submissionId);

        if (collectionUpdateError) throw collectionUpdateError;
      }

      if (submissionUserId) {
        const songTitles = songIds.map(id => get().songs.find(s => s.id === id)?.title).filter(Boolean);
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: submissionUserId,
            type: 'worship_rejected',
            title: 'Worship Submission Rejected',
            message: songTitles.length > 0
              ? `Your submission for "${songTitles.join(', ')}" has been rejected.`
              : submissionMessage || 'Your worship submission has been rejected.',
            data: { submissionId, songIds, status: 'rejected' },
            read: false
          });

        if (notificationError) {
          if (isMissingTableError(notificationError, 'notifications')) {
            console.error('[CRITICAL] Notifications table missing. Rejection notification could not be saved.');
          } else {
            console.warn('[WARN] Could not insert rejection notification:', notificationError);
          }
        }
      }

      set(state => ({
        worshipSubmissions: state.worshipSubmissions.filter(s => s.id !== submissionId)
      }));

      await get().fetchWorshipSubmissions();
      await get().fetchSongs();
    } catch (err: any) {
      console.error('[CRITICAL] Error declining worship submission:', err);
      alert(`Could not decline: ${err.message || 'Unknown error'}`);
    }
  },

  deleteWorshipSubmission: async (submissionId: string) => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    if (!currentUser || currentUser.role !== 'admin') return;

    try {
      let isCollectionFallback = false;
      const { error: submissionError } = await supabase
        .from('worship_submissions')
        .delete()
        .eq('id', submissionId);

      if (submissionError) {
        if (isMissingTableError(submissionError, 'worship_submissions')) {
          isCollectionFallback = true;
        } else {
          throw submissionError;
        }
      }

      if (isCollectionFallback) {
        const { error: collectionError } = await supabase
          .from('worship_collections')
          .delete()
          .eq('id', submissionId);

        if (collectionError) throw collectionError;
      } else {
        // Delete associated collection entries
        const { error: collectionError } = await supabase
          .from('worship_collections')
          .delete()
          .eq('submission_id', submissionId);

        if (collectionError) throw collectionError;
      }

      await get().fetchWorshipSubmissions();
    } catch (err: any) {
      console.error('[CRITICAL] Error deleting worship submission:', err);
      alert(`Could not delete submission: ${err.message || 'Unknown error'}`);
    }
  },

  getPickCount: (songId: string) => {
    if (!isSupabaseConfigured) return 0;
    
    // This would require an additional query to get pick counts
    // For now, returning the pick count from song data
    const song = get().songs.find(s => s.id === songId);
    return song?.pickCount || 0;
  },

  // Cart methods (ephemeral shopping cart - in-memory only)
  addToCart: (songId: string) => {
    set((state) => ({
      cartItems: state.cartItems.includes(songId) ? state.cartItems : [...state.cartItems, songId]
    }));
  },

  removeFromCart: (songId: string) => {
    set((state) => ({
      cartItems: state.cartItems.filter(id => id !== songId)
    }));
  },

  clearCart: () => {
    set({ cartItems: [] });
  },

  isInCart: (songId: string) => {
    const { cartItems } = get();
    return cartItems.includes(songId);
  },

  getPendingPublisherCount: () => {
    const { songs } = get();
    return songs.filter(s => s.status === 'pending').length;
  },

  getPendingWorshipCount: () => {
    const { worshipSubmissions } = get();
    return worshipSubmissions.filter(s => s.status === 'pending').length;
  },

  getPendingAccessCount: () => {
    const { users } = get();
    return users.filter(u => u.role === 'user').length; // Count of regular users (could enhance with access requests)
  },

  // Notification methods
  fetchNotifications: async () => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingTableError(error, 'notifications')) {
          console.error('[CRITICAL] Notifications table missing. Create public.notifications in Supabase to enable inbox messages.');
          set({ notifications: [] });
          return;
        }
        throw error;
      }

      const formattedNotifications: Notification[] = (data || []).map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        read: n.read,
        createdAt: n.created_at
      }));

      set({ notifications: formattedNotifications });
    } catch (err: any) {
      console.error('[CRITICAL] Error fetching notifications:', err);
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      }));
    } catch (err: any) {
      console.error('[CRITICAL] Error marking notification as read:', err);
    }
  },

  deleteNotification: async (notificationId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      set(state => ({
        notifications: state.notifications.filter(n => n.id !== notificationId)
      }));
    } catch (err: any) {
      console.error('[CRITICAL] Error deleting notification:', err);
    }
  },

  clearAllNotifications: async () => {
    if (!isSupabaseConfigured) return;
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', currentUser.id);

      if (error) throw error;

      set({ notifications: [] });
    } catch (err: any) {
      console.error('[CRITICAL] Error clearing all notifications:', err);
    }
  }
}));
