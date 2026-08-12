const fs = require('fs');
let content = fs.readFileSync('src/pages/Notifications.tsx', 'utf8');

content = content.replace("  // Since we don't have a real backend creating these yet, we will just show empty state\n  // or mock notifications if they existed.\n", "");

fs.writeFileSync('src/pages/Notifications.tsx', content);
