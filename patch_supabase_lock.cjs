const fs = require('fs');
let content = fs.readFileSync('src/lib/supabase.ts', 'utf8');

content = content.replace(
  'detectSessionInUrl: true',
  'detectSessionInUrl: true,\n        lock: (name, timeout, fn) => fn()'
);
fs.writeFileSync('src/lib/supabase.ts', content);
