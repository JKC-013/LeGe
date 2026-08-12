const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

// Replace the entire block starting from <div className="sm:col-span-1"> containing thumbnail-upload 
// up to the <div className="sm:col-span-2"> for songName.
const startIdx = content.indexOf('<div className="sm:col-span-1">');
// there are two sm:col-span-1, one for pdf, one for thumbnail.
const firstColSpan = content.indexOf('<div className="sm:col-span-1">');
const secondColSpan = content.indexOf('<div className="sm:col-span-1">', firstColSpan + 1);
const nextSection = content.indexOf('<div className="sm:col-span-2">');

if (secondColSpan !== -1 && secondColSpan < nextSection) {
  content = content.substring(0, secondColSpan) + content.substring(nextSection);
}

// Change the first col-span-1 to col-span-2 since it now takes full width
content = content.replace('<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">\n            <div className="sm:col-span-1">', '<div className="grid grid-cols-1 gap-6">\n            <div className="sm:col-span-1">');
// or let's just make the pdf upload col-span-2
content = content.replace('<div className="sm:col-span-1">\n              <label className="block text-sm font-bold text-on-surface mb-2">{t(\'publisher.uploadPdf\')}</label>', '<div className="sm:col-span-2">\n              <label className="block text-sm font-bold text-on-surface mb-2">{t(\'publisher.uploadPdf\')}</label>');


fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
