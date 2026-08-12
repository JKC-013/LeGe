const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

content = content.replace(/console\.log\('[1-8]\..*?'(?:,.*?)*\);\n\s*/g, '');
fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
