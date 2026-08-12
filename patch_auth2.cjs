const fs = require('fs');
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

// Increase timeout to 30s just in case
content = content.replace('ms: number = 10000', 'ms: number = 30000');

fs.writeFileSync('src/components/AuthModal.tsx', content);
