const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

content = content.replace(
  'thumbnail_url: songData.thumbnailUrl,',
  '/* thumbnail_url: songData.thumbnailUrl, // Needs ALTER TABLE songs ADD COLUMN thumbnail_url TEXT; */'
);

fs.writeFileSync('src/store.ts', content);
