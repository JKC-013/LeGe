import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'khiemvinhtran1112@gmail.com',
    password: 'password' // We don't have the password, we can't test RLS insert
  });
  
  // Just query the schema to see if thumbnail_url is text
  // We can't easily do it without postgres connection string.
}
run();
