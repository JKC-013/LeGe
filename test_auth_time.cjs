require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function test() {
  console.time('signIn');
  const res = await supabase.auth.signInWithPassword({ email: 'khiemvinhtran1112@gmail.com', password: 'password123' });
  console.timeEnd('signIn');
  console.log(res);
}
test();
