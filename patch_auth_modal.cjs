const fs = require('fs');
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

const target = `      } else {
        const { data, error } = await withTimeout(supabase.auth.signInWithPassword({
          email,
          password,
        }));
        if (error) throw error;`;

const replacement = `      } else {
        console.log('[AuthModal] Starting signInWithPassword...');
        const signInPromise = supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log('[AuthModal] Promise created');
        const { data, error } = await withTimeout(signInPromise);
        console.log('[AuthModal] Promise resolved:', { data, error });
        if (error) throw error;`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/AuthModal.tsx', content);
