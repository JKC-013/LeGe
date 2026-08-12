import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Logging in...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'khiemvinhtran1112@gmail.com',
    password: 'password123'
  });
  
  if (authError) {
    console.log("Login error:", authError);
    return;
  }
  
  console.log("Logged in:", authData.user.id);
  
  const fileContent = fs.readFileSync('dummy.pdf');
  
  console.log("Uploading file...");
  const filePath = `pdfs/test_upload_${Date.now()}.pdf`;
  const { data, error } = await supabase.storage
    .from('music-sheets')
    .upload(filePath, fileContent, {
      contentType: 'application/pdf',
      upsert: true
    });
    
  if (error) {
    console.log("Upload error:", error);
  } else {
    console.log("Upload success:", data);
  }
}

run();
