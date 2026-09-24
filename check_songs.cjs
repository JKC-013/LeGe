const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
console.log('URL:', url ? 'exists' : 'missing');
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('songs').select('*').limit(3);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Songs sample:', JSON.stringify(data, null, 2));
  }
}
check();
