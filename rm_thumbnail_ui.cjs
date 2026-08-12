const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

const regex = /<div className="sm:col-span-2">\s*<label className="block text-sm font-bold text-on-surface mb-2">Upload Thumbnail Image \(Optional\)<\/label>[\s\S]*?<div className="sm:col-span-2">\s*<label className="block text-sm font-bold text-on-surface mb-2">\{t\('publisher\.songName'\)\}<\/label>/;

content = content.replace(regex, '<div className="sm:col-span-2">\n              <label className="block text-sm font-bold text-on-surface mb-2">{t(\'publisher.songName\')}</label>');

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
