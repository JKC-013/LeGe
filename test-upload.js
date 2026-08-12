import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const blob = new Blob(["dummy content"], { type: 'application/pdf' });
  const { data, error } = await supabase.storage.from('music-sheets').upload('pdfs/test.pdf', blob, { upsert: true });
  console.log("Upload result:", data, error);
}
run();
