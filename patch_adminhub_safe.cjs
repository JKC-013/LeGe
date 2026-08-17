const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminHub.tsx', 'utf8');

const oldFilter = "const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) || (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())));";

const newFilter = `const safeQuery = (searchQuery || '').trim().toLowerCase();
  const filteredUsers = users.filter(u => {
    const emailMatch = u.email ? u.email.toLowerCase().includes(safeQuery) : false;
    const nameMatch = u.name ? u.name.toLowerCase().includes(safeQuery) : false;
    return emailMatch || nameMatch;
  });`;

content = content.replace(oldFilter, newFilter);

fs.writeFileSync('src/pages/AdminHub.tsx', content);
