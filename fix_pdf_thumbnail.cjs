const fs = require('fs');
let content = fs.readFileSync('src/lib/pdfThumbnail.ts', 'utf8');

// Add a timeout to the promise so it doesn't hang indefinitely
content = content.replace(
  'return new Promise((resolve, reject) => {',
  'return new Promise((resolve, reject) => {\n    const timeoutId = setTimeout(() => reject(new Error("PDF generation timeout")), 10000);\n'
);

content = content.replace(
  'resolve(blob);',
  'clearTimeout(timeoutId);\n            resolve(blob);'
);

content = content.replace(
  'reject(new Error("Failed to generate blob from canvas"));',
  'clearTimeout(timeoutId);\n            reject(new Error("Failed to generate blob from canvas"));'
);

content = content.replace(
  'reject(err);',
  'clearTimeout(timeoutId);\n        reject(err);'
);

content = content.replace(
  'fileReader.onerror = reject;',
  'fileReader.onerror = (err) => { clearTimeout(timeoutId); reject(err); };'
);

// We can also fallback to mjs worker in node_modules if we import it, but standard way in vite is to use a worker URL from the build.
// Alternatively, let's just make sure it fails fast if there is an error, so the main upload still proceeds!
fs.writeFileSync('src/lib/pdfThumbnail.ts', content);
