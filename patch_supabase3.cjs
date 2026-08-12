const fs = require('fs');
let content = fs.readFileSync('src/lib/supabase.ts', 'utf8');

// Replace the entire export const supabase line
content = `import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Provide a safe lock implementation for iframe environments where navigator.locks might hang
const safeLock = async (name, acquireTimeout, fn) => {
  return await fn();
};

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: window.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        lock: safeLock
      }
    })
  : null as any;
`;

fs.writeFileSync('src/lib/supabase.ts', content);
