import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('songs').select('title, status, thumbnail_url, pdf_url').order('created_at', { ascending: false }).limit(5);
  if (data) {
    for (const s of data) {
      console.log(`Title: ${s.title}, Status: ${s.status}, Thumb: ${s.thumbnail_url ? s.thumbnail_url.substring(0, 30) + '...' : 'none'}, PDF: ${s.pdf_url}`);
    }
  } else {
    console.log(error);
  }
}
run();
