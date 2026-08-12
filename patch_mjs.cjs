const fs = require('fs');
let thumbnail = fs.readFileSync('src/lib/pdfThumbnail.ts', 'utf8');
thumbnail = thumbnail.replace("import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';", "import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';");
fs.writeFileSync('src/lib/pdfThumbnail.ts', thumbnail);

let viewer = fs.readFileSync('src/components/PdfViewer.tsx', 'utf8');
viewer = viewer.replace("import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';", "import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';");
fs.writeFileSync('src/components/PdfViewer.tsx', viewer);
