const fs = require('fs');
let content = fs.readFileSync('src/lib/pdfThumbnail.ts', 'utf8');

const target = `        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;`;

const replacement = `        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext as any).promise;`;

content = content.replace(target, replacement);
fs.writeFileSync('src/lib/pdfThumbnail.ts', content);
