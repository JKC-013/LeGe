const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');

content = content.replace(
  '"home.signedInAs": "您以 {{role}} 身分登入。"',
  '"home.signedInAs": "您以 {{role}} 身分登入。",'
);

content = content.replace(
  '"home.signedInAs": "Bạn đã đăng nhập dưới quyền {{role}}."',
  '"home.signedInAs": "Bạn đã đăng nhập dưới quyền {{role}}.",'
);

fs.writeFileSync('src/i18n.ts', content);
