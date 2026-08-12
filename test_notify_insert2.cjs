require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('notifications').insert([{
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    message: 'Test message',
    type: 'approval'
  }]).select();
  console.log(error ? 'Error: ' + error.message : 'Success');
  if (data) console.log(data);
}
test();
