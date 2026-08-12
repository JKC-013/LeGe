const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

content = content.replace(
  'const session = response.data.session;',
  'const session = response?.data?.session || null;'
);

fs.writeFileSync('src/store.ts', content);
