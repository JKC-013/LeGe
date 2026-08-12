const fs = require('fs');
let content = fs.readFileSync('src/lib/pdfThumbnail.ts', 'utf8');

// Change return type to Promise<string>
content = content.replace(
  'Promise<Blob>',
  'Promise<string>'
);

// Use toDataURL instead of toBlob
const targetBlob = `                canvas.toBlob((blob) => {
          if (blob) {
            clearTimeout(timeoutId);
            resolve(blob);
          } else {
            clearTimeout(timeoutId);
            reject(new Error("Failed to generate blob from canvas"));
          }
        }, 'image/jpeg', 0.8);`;

const replacementBase64 = `                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                clearTimeout(timeoutId);
                resolve(dataUrl);`;

content = content.replace(targetBlob, replacementBase64);
fs.writeFileSync('src/lib/pdfThumbnail.ts', content);
