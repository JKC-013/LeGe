const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');

// Add translation keys for Home
content = content.replace(
  '"home.page": "第 {{current}} / {{total}} 頁",',
  '"home.page": "第 {{current}} / {{total}} 頁",\n      "home.goToAdminHub": "前往管理員中心",\n      "home.goToPublisherDashboard": "前往發布者儀表板",'
);

content = content.replace(
  '"home.page": "Trang {{current}} / {{total}}",',
  '"home.page": "Trang {{current}} / {{total}}",\n      "home.goToAdminHub": "Đến Trung tâm quản trị",\n      "home.goToPublisherDashboard": "Đến Bảng điều khiển người đăng",'
);

fs.writeFileSync('src/i18n.ts', content);
