const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

content = content.replace(
  'onClick={() => selectSuggestion(song)}',
  'onMouseDown={(e) => { e.preventDefault(); selectSuggestion(song); }}'
);

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
