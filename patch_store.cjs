const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

const target = `    supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        await handleSession(session);
      } catch (err) {
        console.error("Error in onAuthStateChange:", err);
      }
    });`;

const replacement = `    supabase.auth.onAuthStateChange((event, session) => {
      handleSession(session).catch((err) => {
        console.error("Error in onAuthStateChange:", err);
      });
    });`;

content = content.replace(target, replacement);
fs.writeFileSync('src/store.ts', content);
