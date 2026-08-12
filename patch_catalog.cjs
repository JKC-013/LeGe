const fs = require('fs');
let content = fs.readFileSync('src/pages/SongsCatalog.tsx', 'utf8');

content = content.replace(
  `className="aspect-[4/3] bg-surface-container rounded-xl overflow-hidden relative flex items-center justify-center group-hover:scale-[1.02] transition-transform"`,
  `className="aspect-[3/4] bg-surface-container rounded-xl overflow-hidden relative flex items-center justify-center group-hover:scale-[1.02] transition-transform"`
);

fs.writeFileSync('src/pages/SongsCatalog.tsx', content);
