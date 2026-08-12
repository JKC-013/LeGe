const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');

content = content.replace(
  '"song.empty": "空",',
  '"song.empty": "空",\n      "song.loginFirst": "請先登入。",\n      "song.addedToQueue": "已加入請求佇列！",\n      "song.noPdf": "沒有可用的 PDF",'
);

content = content.replace(
  '"song.empty": "Trống",',
  '"song.empty": "Trống",\n      "song.loginFirst": "Vui lòng đăng nhập trước.",\n      "song.addedToQueue": "Đã thêm vào giỏ yêu cầu!",\n      "song.noPdf": "Không có PDF",'
);

fs.writeFileSync('src/i18n.ts', content);
