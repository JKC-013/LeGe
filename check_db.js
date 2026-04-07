import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDb() {
  console.log("Checking users table...");
  const { data, error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    console.error("Error querying users table:", error.message);
  } else {
    console.log("Users table exists. Data:", data);
  }
}

checkDb();
