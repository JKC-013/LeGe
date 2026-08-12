require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'khiemvinhtran1112@gmail.com',
    password: 'password123'
  });
  if (authError) {
    console.log('Auth error:', authError);
    return;
  }
  const { data, error } = await supabase.from('songs').insert([{
    title: 'Test',
    organization: 'Test',
    category: 'Worship',
    pdf_url: 'http://test.com',
    thumbnail_url: 'http://test.com/thumb.jpg',
    status: 'pending',
    created_by: authData.user.id
  }]);
  console.log('Insert Error:', error);
}
test();
