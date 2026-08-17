const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');

content = content.replace(
  '"nav.home": "首頁",',
  '"nav.home": "首頁",\n      "nav.songs": "詩歌",'
);

content = content.replace(
  '"nav.home": "Trang chủ",',
  '"nav.home": "Trang chủ",\n      "nav.songs": "Bài hát",'
);

fs.writeFileSync('src/i18n.ts', content);
