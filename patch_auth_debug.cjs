const fs = require('fs');
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

content = content.replace(
  'const handleSubmit = async (e: React.FormEvent) => {',
  'const handleSubmit = async (e: React.FormEvent) => {\n    console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);\n'
);

fs.writeFileSync('src/components/AuthModal.tsx', content);
