const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

content = content.replace(
  '(Type to search existing songs)',
  "{t('publisher.searchHint')}"
);
content = content.replace(
  'placeholder="Search or enter new song name..."',
  'placeholder={t("publisher.searchPlaceholder")}'
);

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);

let i18n = fs.readFileSync('src/i18n.ts', 'utf8');

i18n = i18n.replace(
  /"publisher\.songName": "Song Name",/g,
  '"publisher.songName": "Song Name",\n      "publisher.searchHint": "(Type to search existing songs)",\n      "publisher.searchPlaceholder": "Search or enter new song name...",'
);

i18n = i18n.replace(
  /"publisher\.songName": "歌曲名稱",/g,
  '"publisher.songName": "歌曲名稱",\n      "publisher.searchHint": "(輸入以搜尋現有詩歌)",\n      "publisher.searchPlaceholder": "搜尋或輸入新詩歌名稱...",'
);

i18n = i18n.replace(
  /"publisher\.songName": "Tên bài hát",/g,
  '"publisher.songName": "Tên bài hát",\n      "publisher.searchHint": "(Gõ để tìm bài hát hiện có)",\n      "publisher.searchPlaceholder": "Tìm kiếm hoặc nhập tên bài hát mới...",'
);

fs.writeFileSync('src/i18n.ts', i18n);
