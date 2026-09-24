const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function list() {
  const { data, error } = await supabase.from('songs').select('id, title, versions, keys, status, created_at, pdf_url');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
list();
