const fs = require('fs');
let content = fs.readFileSync('src/lib/pdfThumbnail.ts', 'utf8');

const target = `import * as pdfjsLib from 'pdfjs-dist';

// Use a local worker to avoid unpkg timeouts/CSP issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();`;

const replacement = `import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;`;

content = content.replace(target, replacement);
fs.writeFileSync('src/lib/pdfThumbnail.ts', content);
