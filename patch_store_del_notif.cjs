const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

content = content.replace(
  "fetchNotifications: () => Promise<void>;",
  "fetchNotifications: () => Promise<void>;\n  deleteNotification: (id: string) => Promise<void>;"
);

const delNotifImpl = `  deleteNotification: async (id) => {
    if (!isSupabaseConfigured) return;
    await supabase.from('notifications').delete().eq('id', id);
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },`;

content = content.replace(
  "fetchNotifications: async () => {",
  delNotifImpl + "\n\n  fetchNotifications: async () => {"
);

fs.writeFileSync('src/store.ts', content);
