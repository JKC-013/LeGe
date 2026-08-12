const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');

content = content.replace(
  '"publisher.success": "已成功提交審核！",',
  '"publisher.success": "已成功提交審核！",\n      "publisher.pdfLimit": "PDF 上限 10MB",\n      "publisher.uploading": "上傳中...",'
);

content = content.replace(
  '"publisher.success": "Đã gửi để duyệt thành công!",',
  '"publisher.success": "Đã gửi để duyệt thành công!",\n      "publisher.pdfLimit": "PDF tối đa 10MB",\n      "publisher.uploading": "Đang tải lên...",'
);

fs.writeFileSync('src/i18n.ts', content);
