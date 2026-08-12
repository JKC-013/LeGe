const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

content = content.replace(/console\.log\('7\.[1-5]\..*?'(?:,.*?)*\);\n\s*/g, '');
fs.writeFileSync('src/store.ts', content);
