const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');

content = content.replace(
  '"home.page": "第 {{current}} 頁，共 {{total}} 頁",',
  '"home.page": "第 {{current}} 頁，共 {{total}} 頁",\n      "home.goToAdminHub": "前往管理員中心",\n      "home.goToPublisherDashboard": "前往發布者儀表板",\n      "home.welcomeBack": "歡迎回來，{{name}}！",\n      "home.signedInAs": "您以 {{role}} 身分登入。"'
);

fs.writeFileSync('src/i18n.ts', content);
