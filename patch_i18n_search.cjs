const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');

content = content.replace(/"admin\.searchUser": "透過電子郵件或名稱搜尋使用者...",/g, '"admin.searchQuery": "搜尋...",');
content = content.replace(/"admin\.searchUser": "Tìm người dùng qua email hoặc tên...",/g, '"admin.searchQuery": "Tìm kiếm...",');

fs.writeFileSync('src/i18n.ts', content);
