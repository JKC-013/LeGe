const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

// Find the start of the block containing the thumbnail upload
// It's after the PDF upload block.
const uploadBlocksRegex = /<div className="sm:col-span-1">[\s\S]*?Upload Thumbnail Image \(Optional\)[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div className="sm:col-span-2">/;

content = content.replace(uploadBlocksRegex, '<div className="sm:col-span-2">');

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
