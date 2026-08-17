const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminHub.tsx', 'utf8');

content = content.replace(/searchEmail/g, 'searchQuery');
content = content.replace(/setSearchEmail/g, 'setSearchQuery');
content = content.replace(/'admin\.searchEmail'/g, "'admin.searchUser'");

fs.writeFileSync('src/pages/AdminHub.tsx', content);
