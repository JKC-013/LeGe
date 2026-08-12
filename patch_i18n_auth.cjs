const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');

content = content.replace(
  '"auth.switchSignUp": "還沒有帳戶？註冊",',
  '"auth.switchSignUp": "還沒有帳戶？註冊",\n      "auth.passwordsNotMatch": "密碼不符。",\n      "auth.emailRegistered": "此電子郵件已註冊。請改為登入。",\n      "auth.requestTimeout": "請求超時，請重試。",'
);

content = content.replace(
  '"auth.switchSignUp": "Chưa có tài khoản? Đăng ký",',
  '"auth.switchSignUp": "Chưa có tài khoản? Đăng ký",\n      "auth.passwordsNotMatch": "Mật khẩu không khớp.",\n      "auth.emailRegistered": "Email này đã được đăng ký. Vui lòng đăng nhập.",\n      "auth.requestTimeout": "Yêu cầu đã hết hạn. Vui lòng thử lại.",'
);

fs.writeFileSync('src/i18n.ts', content);
