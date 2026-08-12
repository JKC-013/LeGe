const fs = require('fs');
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');
content = content.replace(
  'console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);',
  ''
);
fs.writeFileSync('src/components/AuthModal.tsx', content);
