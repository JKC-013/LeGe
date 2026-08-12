const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

const target = `    const { error: insertError } = await supabase.from('songs').insert([dbSong]);
    if (insertError) {`;

const replacement = `    console.log('Inserting song into DB...', dbSong);
    const { error: insertError } = await supabase.from('songs').insert([dbSong]);
    if (insertError) {
      console.error('Insert Error:', insertError);`;

content = content.replace(target, replacement);

fs.writeFileSync('src/store.ts', content);
