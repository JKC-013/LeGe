import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'khiemvinhtran1112@gmail.com',
    password: 'password' // Cannot really test without password
  });
  console.log('Testing upload...');
}
run();
