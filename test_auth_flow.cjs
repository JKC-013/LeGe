const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';
  
  console.log('Signing up', email);
  const { data: upData, error: upErr } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: 'Test User' } }
  });
  console.log('Sign up error:', upErr?.message);
  
  console.log('Signing in', email);
  const { data: inData, error: inErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  console.log('Sign in error:', inErr?.message);
  console.log('Session:', !!inData?.session);
}
test();
