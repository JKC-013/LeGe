const fs = require('fs');
let content = fs.readFileSync('src/components/PdfViewer.tsx', 'utf8');
content = content.replace('react-pdf/dist/esm/Page/AnnotationLayer.css', 'react-pdf/dist/Page/AnnotationLayer.css');
content = content.replace('react-pdf/dist/esm/Page/TextLayer.css', 'react-pdf/dist/Page/TextLayer.css');
fs.writeFileSync('src/components/PdfViewer.tsx', content);
