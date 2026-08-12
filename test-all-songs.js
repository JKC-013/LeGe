import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('songs').select('*');
  console.log("Total songs:", data?.length);
  if (data) {
    for (const s of data) {
      console.log(`Title: ${s.title}, Status: ${s.status}, CreatedAt: ${s.created_at}`);
    }
  }
}
run();
