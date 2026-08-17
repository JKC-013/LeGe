const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminHub.tsx', 'utf8');

content = content.replace("console.log('AdminHub users:', users);\n  const pendingSongs", "const pendingSongs");

fs.writeFileSync('src/pages/AdminHub.tsx', content);
