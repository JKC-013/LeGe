const fs = require('fs');
let content = fs.readFileSync('src/lib/supabase.ts', 'utf8');

const target = `const safeLock = async (name, acquireTimeout, fn) => {
  return await fn();
};`;

const replacement = `const safeLock = async (name, acquireTimeout, fn) => {
  console.log('[safeLock] acquiring', name);
  const result = await fn();
  console.log('[safeLock] released', name);
  return result;
};`;

content = content.replace(target, replacement);
fs.writeFileSync('src/lib/supabase.ts', content);
