const fs = require('fs');
let content = fs.readFileSync('src/lib/pdfThumbnail.ts', 'utf8');

content = content.replace(
  /pdfjsLib\.GlobalWorkerOptions\.workerSrc = `.*`;/,
  'pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;'
);

fs.writeFileSync('src/lib/pdfThumbnail.ts', content);
