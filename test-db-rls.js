import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'khiemvinhtran1112@gmail.com',
    password: 'password' // I still don't know the password.
  });
  console.log("Auth:", authData.user ? "Success" : "Fail");
}
run();
