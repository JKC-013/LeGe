const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    lock: async (name, acquireTimeout, fn) => {
      console.log('lock called', name);
      return await fn();
    }
  }
});

async function run() {
  console.log('signing in...');
  const res = await supabase.auth.signInWithPassword({
    email: 'khiemvinhtran1112@gmail.com',
    password: 'wrongpassword'
  });
  console.log('result', res);
}
run();
