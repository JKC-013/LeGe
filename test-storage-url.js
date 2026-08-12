import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data } = supabase.storage.from('music-sheets').getPublicUrl('pdfs/fgy1yputs4s.pdf');
  console.log(data);
}
run();
