const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('users').select('*');
  console.log('Users in public.users:', data);
  const { data: authUsers, error: authError } = await supabase.auth.admin?.listUsers() || { data: null, error: new Error('No admin key') };
  console.log('Users in auth (requires admin key, might fail):', authUsers, authError);
}
test();
