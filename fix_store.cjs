const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

// Replace the timeout Promise.race with just awaiting getSession
const target = `      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('getSession timeout')), 3000));
      const response = await Promise.race([sessionPromise, timeoutPromise]);
      const session = response?.data?.session || null;`;

const replacement = `      const response = await supabase.auth.getSession();
      const session = response?.data?.session || null;`;

content = content.replace(target, replacement);
fs.writeFileSync('src/store.ts', content);
