const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

content = content.replace(
  `    if (insertError) {
      console.error('Error adding song to DB:', insertError);
      throw insertError;
      if (insertError.code === '42703') {`,
  `    if (insertError) {
      if (insertError.code === '42703') {`
);

fs.writeFileSync('src/store.ts', content);
