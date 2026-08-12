const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

content = content.replace(
  "alert('Error uploading file. Please check if the \"music-sheets\" bucket exists and is public.');",
  "alert(`Error uploading file: ${error instanceof Error ? error.message : JSON.stringify(error)}`);"
);

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
