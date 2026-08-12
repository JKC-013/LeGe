import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const createMemoryStorage = () => {
  let memory = {};
  return {
    getItem: (key) => memory[key] || null,
    setItem: (key, value) => { memory[key] = value; },
    removeItem: (key) => { delete memory[key]; },
    clear: () => { memory = {}; }
  };
};

const getStorage = () => {
  if (typeof window === 'undefined') return createMemoryStorage();
  try {
    const testKey = '__test_storage__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (e) {
    console.warn('localStorage is blocked, falling back to memory storage');
    return createMemoryStorage();
  }
};

const safeLock = async (name, acquireTimeout, fn) => {
  return await fn();
};

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: getStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        lock: safeLock
      }
    })
  : null as any;
