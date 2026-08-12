const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'khiemvinhtran1112@gmail.com',
      password: 'password123',
      options: { data: { name: 'Test' } }
    });
    console.log('Sign up complete:', { error: error?.message, data });
  } catch (err) {
    console.error('Caught error:', err);
  }
}
test();
