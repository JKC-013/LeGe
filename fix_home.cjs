const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(
  'const { currentUser, toggleFavourite, addToRequestQueue, requestQueue } = useStore();',
  'const { currentUser, toggleFavourite, addToRequestQueue, removeFromRequestQueue, requestQueue } = useStore();'
);

content = content.replace(
  /onClick={\(e\) => { e\.preventDefault\(\); addToRequestQueue\(song\.id\); }}/g,
  `onClick={(e) => { e.preventDefault(); inQueue ? removeFromRequestQueue(song.id) : addToRequestQueue(song.id); }}`
);

content = content.replace(
  /<Mic className="w-4 h-4" \/>/g,
  '<Mic className="w-4 h-4" fill={inQueue ? "currentColor" : "none"} />'
);

fs.writeFileSync('src/pages/Home.tsx', content);
