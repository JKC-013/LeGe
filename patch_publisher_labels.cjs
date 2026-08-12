const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

content = content.replace(
  '<p className="text-xs text-outline-variant">PDF up to 10MB</p>',
  '<p className="text-xs text-outline-variant">{t(\'publisher.pdfLimit\')}</p>'
);

content = content.replace(
  'Uploading...',
  '{t(\'publisher.uploading\')}'
);

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
