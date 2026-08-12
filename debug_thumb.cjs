const fs = require('fs');
let content = fs.readFileSync('src/lib/pdfThumbnail.ts', 'utf8');

const target = `      try {
        const pdf = await pdfjsLib.getDocument(typedarray).promise;`;

const replacement = `      try {
        console.log('5.1 Loading PDF document...');
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        console.log('5.2 PDF document loaded.');`;

content = content.replace(target, replacement);

const target2 = `        const page = await pdf.getPage(1);
        
        const scale = 1.5;`;

const replacement2 = `        console.log('5.3 Loading page 1...');
        const page = await pdf.getPage(1);
        console.log('5.4 Page 1 loaded.');
        
        const scale = 1.5;`;

content = content.replace(target2, replacement2);

const target3 = `        await page.render(renderContext).promise;
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);`;

const replacement3 = `        console.log('5.5 Rendering page...');
        await page.render(renderContext).promise;
        console.log('5.6 Page rendered.');
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);`;

content = content.replace(target3, replacement3);
fs.writeFileSync('src/lib/pdfThumbnail.ts', content);
