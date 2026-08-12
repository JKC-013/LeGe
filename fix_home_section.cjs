const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(
  '<section className="bg-primary/10 rounded-2xl p-6 border border-primary/20 flex flex-col sm:flex-row items-center justify-between shadow-ambient">',
  '<section className="bg-primary/10 rounded-2xl p-6 border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-ambient">'
);

fs.writeFileSync('src/pages/Home.tsx', content);
