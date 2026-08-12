const fs = require('fs');
let content = fs.readFileSync('src/pages/SongDetail.tsx', 'utf8');

const targetSelect = `            <div className="relative">
              <select 
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}`;

const replacementSelect = `            <div className="relative">
              <select 
                value={(!song.keys || song.keys.length === 0 || !song.versions?.includes(selectedVersion)) ? "Empty" : selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}`;

content = content.replace(targetSelect, replacementSelect);
fs.writeFileSync('src/pages/SongDetail.tsx', content);
