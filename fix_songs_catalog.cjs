const fs = require('fs');
let content = fs.readFileSync('src/pages/SongsCatalog.tsx', 'utf8');

// Also import removeFromRequestQueue if needed
content = content.replace(
  'const { songs, currentUser, toggleFavourite, addToRequestQueue, requestQueue } = useStore();',
  'const { songs, currentUser, toggleFavourite, addToRequestQueue, removeFromRequestQueue, requestQueue } = useStore();'
);

content = content.replace(
  /onClick={\(e\) => { e\.preventDefault\(\); addToRequestQueue\(song\.id\); }}/g,
  `onClick={(e) => { e.preventDefault(); inQueue ? removeFromRequestQueue(song.id) : addToRequestQueue(song.id); }}`
);

content = content.replace(
  /onClick={\(\) => addToRequestQueue\(song\.id\)}/g,
  `onClick={() => inQueue ? removeFromRequestQueue(song.id) : addToRequestQueue(song.id)}`
);

content = content.replace(
  /<Mic className="w-4 h-4" \/>/g,
  '<Mic className="w-4 h-4" fill={inQueue ? "currentColor" : "none"} />'
);

content = content.replace(
  /<Mic className="w-5 h-5" \/>/g,
  '<Mic className="w-5 h-5" fill={inQueue ? "currentColor" : "none"} />'
);

fs.writeFileSync('src/pages/SongsCatalog.tsx', content);
