const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');

content = content.replace(
  '"home.goToPublisherDashboard": "前往發布者儀表板",',
  '"home.goToPublisherDashboard": "前往發布者儀表板",\n      "home.welcomeBack": "歡迎回來，{{name}}！",\n      "home.signedInAs": "您以 {{role}} 身分登入。",'
);

content = content.replace(
  '"home.goToPublisherDashboard": "Đến Bảng điều khiển người đăng",',
  '"home.goToPublisherDashboard": "Đến Bảng điều khiển người đăng",\n      "home.welcomeBack": "Chào mừng trở lại, {{name}}!",\n      "home.signedInAs": "Bạn đã đăng nhập dưới quyền {{role}}.",'
);

fs.writeFileSync('src/i18n.ts', content);
