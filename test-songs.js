import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: songsData, error } = await supabase.from('songs').select('*');
  console.log("Error:", error);
  if (songsData) {
    const formattedSongs = songsData.map(s => ({
      id: s.id,
      title: s.title || 'Untitled',
      organization: s.organization || s.author || '',
      category: s.category || 'Worship',
      pdfUrl: s.pdf_url || '',
      lyrics: s.lyrics || '',
      status: s.status || 'pending',
      keys: s.keys || [],
      versions: s.versions || [],
      approval_count: s.approval_count || 0
    }));
    console.log("Formatted:", formattedSongs);
  }
}
test();
