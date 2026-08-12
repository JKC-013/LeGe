const fs = require('fs');
let content = fs.readFileSync('src/pages/Favourites.tsx', 'utf8');

const target = `<div className="absolute inset-0 flex items-center justify-center text-outline-variant">
                  <Music className="w-12 h-12 opacity-20" />
                </div>`;

const replacement = `{song.thumbnailUrl ? (
                  <img src={song.thumbnailUrl} alt={song.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-outline-variant">
                    <Music className="w-12 h-12 opacity-20" />
                  </div>
                )}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/Favourites.tsx', content);
