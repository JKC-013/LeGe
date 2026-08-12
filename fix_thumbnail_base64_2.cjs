const fs = require('fs');
let content = fs.readFileSync('src/lib/pdfThumbnail.ts', 'utf8');

const target = `        canvas.toBlob((blob) => {
          if (blob) {
            clearTimeout(timeoutId);
            resolve(blob);
          } else {
            clearTimeout(timeoutId);
            reject(new Error("Failed to generate blob from canvas"));
          }
        }, 'image/jpeg', 0.8);`;

const replacement = `        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        clearTimeout(timeoutId);
        resolve(dataUrl);`;

content = content.replace(target, replacement);
fs.writeFileSync('src/lib/pdfThumbnail.ts', content);
