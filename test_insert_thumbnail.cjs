require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('songs').insert([{
    title: 'Test',
    organization: 'Test',
    category: 'Worship',
    pdf_url: 'http://test.com',
    thumbnail_url: 'http://test.com/thumb.jpg',
    status: 'pending'
  }]);
  console.log('Error:', error);
}
test();
