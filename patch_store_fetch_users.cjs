const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

const target = "        get().fetchNotifications();";
const replacement = "        get().fetchNotifications();\n        get().fetchUsers();";

content = content.replace(target, replacement);

fs.writeFileSync('src/store.ts', content);
