const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

const target = `    console.log('Inserting song into DB...', dbSong);
    const { error: insertError } = await supabase.from('songs').insert([dbSong]);
    if (insertError) {
      console.error('Insert Error:', insertError);`;

const replacement = `    console.log('7.1. Inserting song into DB...', dbSong);
    const { error: insertError } = await supabase.from('songs').insert([dbSong]);
    console.log('7.2. DB insert finished', insertError);
    if (insertError) {
      console.error('7.3. Insert Error:', insertError);`;

content = content.replace(target, replacement);

const target2 = `    get().fetchSongs();
  },`;

const replacement2 = `    console.log('7.4. Calling fetchSongs()');
    await get().fetchSongs();
    console.log('7.5. fetchSongs() finished');
  },`;
content = content.replace(target2, replacement2);

fs.writeFileSync('src/store.ts', content);
