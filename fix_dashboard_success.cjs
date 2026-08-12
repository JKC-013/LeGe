const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

// Remove setTimeout for success
content = content.replace(
  /setTimeout\(\(\) => setSuccess\(false\), 3000\);/g,
  ''
);

// Add setSuccess(false) when a new file is selected
content = content.replace(
  /setPdfFile\(e\.target\.files\[0\]\);/g,
  'setPdfFile(e.target.files[0]);\n      setSuccess(false);'
);

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
