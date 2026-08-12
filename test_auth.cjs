require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const safeLock = async (name, acquireTimeout, fn) => {
  return await fn();
};
const supabase = createClient(url, key, { auth: { lock: safeLock } });

async function test() {
  console.log("Testing auth...");
  try {
    const res = await supabase.auth.signInWithPassword({ email: 'khiemvinhtran1112@gmail.com', password: 'password123' });
    console.log("Res:", res);
  } catch (e) {
    console.log("Err:", e);
  }
}
test();
