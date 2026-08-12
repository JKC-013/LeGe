const fs = require('fs');
let content = fs.readFileSync('src/pages/SongDetail.tsx', 'utf8');

content = content.replace(
  'alert("Please login first.");',
  'alert(t("song.loginFirst"));'
);

content = content.replace(
  'alert("Added to request queue!");',
  'alert(t("song.addedToQueue"));'
);

content = content.replace(
  'No PDF available',
  '{t("song.noPdf")}'
);

fs.writeFileSync('src/pages/SongDetail.tsx', content);
