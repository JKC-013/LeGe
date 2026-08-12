import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: pdfs } = await supabase.storage.from('music-sheets').list('pdfs');
  console.log("PDFs:", pdfs);
  const { data: thumbs } = await supabase.storage.from('music-sheets').list('thumbnails');
  console.log("Thumbs:", thumbs);
}
run();
