const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');

// The Chinese key is "詩歌名稱", not "歌曲名稱"
content = content.replace(
  /"publisher\.songName": "詩歌名稱",/g,
  '"publisher.songName": "詩歌名稱",\n      "publisher.searchHint": "(輸入以搜尋現有詩歌)",\n      "publisher.searchPlaceholder": "搜尋或輸入新詩歌名稱...",'
);

fs.writeFileSync('src/i18n.ts', content);
