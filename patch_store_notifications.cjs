const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

// Add fetchNotifications to AppState interface
content = content.replace(
  "fetchSongs: () => Promise<void>;",
  "fetchSongs: () => Promise<void>;\n  fetchNotifications: () => Promise<void>;"
);

// Add fetchNotifications call in handleSession
content = content.replace(
  "get().fetchSongs();\n      } else {",
  "get().fetchSongs();\n        get().fetchNotifications();\n      } else {"
);

content = content.replace(
  "get().fetchSongs();\n      }\n    };",
  "get().fetchSongs();\n        set({ notifications: [] });\n      }\n    };"
);

// Add fetchNotifications implementation
const fetchNotificationsImpl = `
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
`;

content = content.replace(
  "fetchSongs: async () => {",
  fetchNotificationsImpl + "\n  fetchSongs: async () => {"
);

// Update approveSong to insert notification
const approveSongImpl = `  approveSong: async (songId) => {
    if (!isSupabaseConfigured) return;
    
    await supabase
      .from('songs')
      .update({ status: 'approved' })
      .eq('id', songId);
      
    const song = get().songs.find(s => s.id === songId);
    if (song && song.created_by) {
      await supabase.from('notifications').insert({
        user_id: song.created_by,
        message: \`Your song "\${song.title}" has been approved!\`,
        type: 'approval',
        read: false
      });
    }
      
    get().fetchSongs();
  },`;

const approveSongRegex = /  approveSong: async \(songId\) => \{[\s\S]*?get\(\)\.fetchSongs\(\);\n  \},/;
content = content.replace(approveSongRegex, approveSongImpl);

// Update declineSong similarly if we want (optional, requested: "check the mail system to see if a publisher submitted a request and the admin approved it")

fs.writeFileSync('src/store.ts', content);
