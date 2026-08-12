const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

const target = `      if (songsData) {
        console.log('Fetched raw songs:', songsData);
        
        const formattedSongs: Song[] = songsData.map(s => ({`;

const replacement = `      if (songsData) {
        console.log('Fetched raw songs:', songsData);
        
        // Filter out known broken records from previous failed tests
        const brokenIds = ['ffa8ee96-7ab8-4eec-b7ec-0e6e53467865', '6f5eb876-9838-40be-a4e6-eff146f677df'];
        const validSongsData = songsData.filter(s => !brokenIds.includes(s.id));
        
        const formattedSongs: Song[] = validSongsData.map(s => ({`;

content = content.replace(target, replacement);
fs.writeFileSync('src/store.ts', content);
