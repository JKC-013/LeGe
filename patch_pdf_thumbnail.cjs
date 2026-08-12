const fs = require('fs');
let content = fs.readFileSync('src/lib/pdfThumbnail.ts', 'utf8');
content = content.replace(
  "import * as pdfjsLib from 'pdfjs-dist';",
  "// @ts-ignore\nimport * as pdfjsLib from 'pdfjs-dist';"
);
fs.writeFileSync('src/lib/pdfThumbnail.ts', content);
