import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const validPdfUrl = 'https://jpisrhssxyruhmufhqlw.supabase.co/storage/v1/object/public/music-sheets/pdfs/fgy1yputs4s.pdf';
  
  // Use a small red pixel base64 for thumbnail testing
  const dummyThumb = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const { data, error } = await supabase
    .from('songs')
    .update({ 
      pdf_url: validPdfUrl,
      thumbnail_url: dummyThumb 
    })
    .neq('id', '0'); // Update all
    
  console.log("Update result:", error);
}
run();
