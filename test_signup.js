import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDb() {
  console.log("Attempting to sign up a test user...");
  const { data, error } = await supabase.auth.signUp({
    email: 'test_trigger_' + Date.now() + '@example.com',
    password: 'password123'
  });
  if (error) {
    console.error("Sign up error:", error.message);
  } else {
    console.log("Sign up success:", data.user?.id);
  }
}

checkDb();
