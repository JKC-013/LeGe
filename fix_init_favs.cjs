const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

content = content.replace(
  'favourites: []',
  'favourites: userFavourites'
);

content = content.replace(
  'const name = profile?.name || session.user.user_metadata?.name;',
  `const name = profile?.name || session.user.user_metadata?.name;

        // Fetch user favourites
        const { data: favsData } = await supabase
          .from('favourites')
          .select('song_id')
          .eq('user_id', session.user.id);
        const userFavourites = favsData ? favsData.map(f => f.song_id) : [];`
);

fs.writeFileSync('src/store.ts', content);
