const fs = require('fs');
console.log(fs.readFileSync('src/pages/Home.tsx', 'utf8').substring(0, 1500));
