const fs = require('fs');
let content = fs.readFileSync('src/pages/PublisherDashboard.tsx', 'utf8');

content = content.replace(
  '<div className="text-xs text-on-surface-variant">{song.organization} • {song.category}</div>',
  '<div className="text-xs text-on-surface-variant">{song.organization} • {song.category === "Worship" ? t("song.worship") : t("song.others")}</div>'
);

fs.writeFileSync('src/pages/PublisherDashboard.tsx', content);
