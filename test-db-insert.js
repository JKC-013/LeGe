import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const dbSong = {
      title: "Test Song",
      organization: "Test Org",
      category: "Worship",
      pdf_url: "https://example.com/test.pdf",
      thumbnail_url: null,
      lyrics: "Test lyrics",
      versions: ["Vietnamese"],
      keys: ["C"],
      status: 'pending',
      created_by: "ffa8ee96-7ab8-4eec-b7ec-0e6e53467865" // Let's try inserting
  };
  const { data, error } = await supabase.from('songs').insert([dbSong]);
  console.log(data, error);
}
run();
