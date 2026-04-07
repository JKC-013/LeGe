import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDb() {
  const { data, error } = await supabase.from('users').insert({ id: '00000000-0000-0000-0000-000000000000', email: 'test@test.com' });
  console.log("Insert error:", error);
}

checkDb();
